"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCategories } from "@/lib/api/categories";
import { getTransactions } from "@/lib/api/transactions";
import { getBudgetProgress, getBudgetsOverview } from "@/lib/api/budgets";
import { ApiError } from "@/lib/api/client";
import type { BudgetProgress, BudgetsOverview, Category, Transaction } from "@/types/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const BAR_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<BudgetsOverview | null>(null);
  const [budgets, setBudgets] = useState<BudgetProgress[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const month = currentMonth();
    getBudgetsOverview(month)
      .then(setOverview)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
    getBudgetProgress(month)
      .then(setBudgets)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
    getTransactions()
      .then(setTransactions)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
  }, []);

  const categoryName = (categoryId: string | null) =>
    categoryId === null
      ? "Non catégorisé"
      : (categories.find((c) => c.id === categoryId)?.name ?? "Non catégorisé");

  const expensesByCategory = useMemo(() => {
    if (!transactions) return [];

    const month = currentMonth();
    const totals = new Map<string | null, number>();
    for (const tx of transactions) {
      if (!tx.date.startsWith(month) || tx.amount >= 0) continue;
      totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + Math.abs(tx.amount));
    }

    const entries = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] ?? 0;

    return entries.map(([categoryId, amount], i) => ({
      categoryId,
      label:
        categoryId === null
          ? "Non catégorisé"
          : (categories.find((c) => c.id === categoryId)?.name ?? "Non catégorisé"),
      amount,
      percentOfMax: max > 0 ? (amount / max) * 100 : 0,
      color: BAR_COLORS[i % BAR_COLORS.length],
    }));
  }, [transactions, categories]);

  const watchBudgets =
    budgets?.filter((b) => b.isOverBudget || b.isProjectedOverBudget || b.percentUsed >= 80) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-lg font-semibold">Tableau de bord</h1>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Revenus</p>
            <p className="text-lg font-semibold">
              {overview ? currencyFormatter.format(overview.totalIncome) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Dépenses</p>
            <p className="text-lg font-semibold">
              {overview ? currencyFormatter.format(overview.totalExpenses) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Dépenses projetées</p>
            <p className="text-lg font-semibold">
              {overview ? currencyFormatter.format(overview.projectedExpensesMonthEnd) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Solde projeté</p>
            <p className="text-lg font-semibold">
              {overview ? currencyFormatter.format(overview.projectedBalance) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dépenses par catégorie</CardTitle>
            <CardDescription>Ce mois-ci</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {expensesByCategory.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune dépense ce mois-ci.</p>
            )}
            {expensesByCategory.map((entry) => (
              <div key={entry.categoryId ?? "none"} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{entry.label}</span>
                  <span className="text-muted-foreground">
                    {currencyFormatter.format(entry.amount)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${entry.color}`}
                    style={{ width: `${Math.max(entry.percentOfMax, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budgets à surveiller</CardTitle>
            <CardDescription>Dépassés ou proches de la limite</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {watchBudgets.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Rien à signaler pour l&apos;instant.
              </p>
            )}
            {watchBudgets.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span>{categoryName(b.categoryId)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{Math.round(b.percentUsed)}%</span>
                  {b.isOverBudget ? (
                    <Badge variant="destructive">Dépassé</Badge>
                  ) : b.isProjectedOverBudget ? (
                    <Badge variant="secondary">Projection</Badge>
                  ) : null}
                </div>
              </div>
            ))}
            <Link
              href="/budgets"
              className={buttonVariants({ variant: "outline", size: "sm", className: "mt-2" })}
            >
              Voir tous les budgets
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
