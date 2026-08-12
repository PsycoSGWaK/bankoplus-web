"use client";

import { useEffect, useState } from "react";
import { getCategories } from "@/lib/api/categories";
import {
  deleteBudget,
  getBudgetProgress,
  getBudgetsOverview,
  simulateBudget,
  upsertBudget,
} from "@/lib/api/budgets";
import { ApiError } from "@/lib/api/client";
import type { BudgetProgress, BudgetSimulation, BudgetsOverview, Category } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GLOBAL = "global";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonth);
  const [categories, setCategories] = useState<Category[]>([]);
  const [overview, setOverview] = useState<BudgetsOverview | null>(null);
  const [progress, setProgress] = useState<BudgetProgress[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formCategoryId, setFormCategoryId] = useState(GLOBAL);
  const [formLimit, setFormLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [simCategoryId, setSimCategoryId] = useState(GLOBAL);
  const [simAmount, setSimAmount] = useState("");
  const [simResult, setSimResult] = useState<BudgetSimulation | null>(null);
  const [simulating, setSimulating] = useState(false);

  function reload() {
    getBudgetsOverview(month)
      .then(setOverview)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
    getBudgetProgress(month)
      .then(setProgress)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
  }

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
  }, []);

  useEffect(reload, [month]);

  const categoryName = (categoryId: string | null) =>
    categoryId === null
      ? "Toutes catégories"
      : (categories.find((c) => c.id === categoryId)?.name ?? categoryId);

  async function handleCreateBudget(e: React.FormEvent) {
    e.preventDefault();
    const monthlyLimit = Number(formLimit);
    if (!monthlyLimit || monthlyLimit <= 0) return;
    setError(null);
    setSubmitting(true);
    try {
      await upsertBudget({
        categoryId: formCategoryId === GLOBAL ? undefined : formCategoryId,
        monthlyLimit,
      });
      setFormLimit("");
      reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteBudget(id);
      setProgress((prev) => prev?.filter((b) => b.id !== id) ?? prev);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    }
  }

  async function handleSimulate(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(simAmount);
    if (!amount || amount <= 0) return;
    setError(null);
    setSimulating(true);
    try {
      const result = await simulateBudget({
        amount,
        categoryId: simCategoryId === GLOBAL ? undefined : simCategoryId,
      });
      setSimResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Budgets</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {overview && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu du mois</CardTitle>
            <CardDescription>
              Jour {overview.daysElapsed} sur {overview.daysInMonth}
              {overview.isCurrentMonth ? " (en cours)" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Revenus</p>
              <p className="font-medium">{currencyFormatter.format(overview.totalIncome)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dépenses</p>
              <p className="font-medium">{currencyFormatter.format(overview.totalExpenses)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dépenses projetées (fin de mois)</p>
              <p className="font-medium">
                {currencyFormatter.format(overview.projectedExpensesMonthEnd)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Solde projeté</p>
              <p className="font-medium">
                {currencyFormatter.format(overview.projectedBalance)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nouveau budget</CardTitle>
          <CardDescription>
            Choisis une catégorie, ou laisse &quot;Toutes catégories&quot; pour un seuil global.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreateBudget}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Label>Catégorie</Label>
              <Select value={formCategoryId} onValueChange={(v) => setFormCategoryId(v ?? GLOBAL)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: unknown) =>
                      value === GLOBAL ? "Toutes catégories" : categoryName(value as string)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GLOBAL}>Toutes catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="limit">Limite mensuelle (€)</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                step="1"
                value={formLimit}
                onChange={(e) => setFormLimit(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {progress !== null && progress.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun budget défini pour ce mois.</p>
        )}

        {progress?.map((b) => (
          <Card key={b.id}>
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{categoryName(b.categoryId)}</span>
                <div className="flex items-center gap-2">
                  {b.isOverBudget && <Badge variant="destructive">Dépassé</Badge>}
                  {!b.isOverBudget && b.isProjectedOverBudget && (
                    <Badge variant="secondary">Dépassement projeté</Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}>
                    Supprimer
                  </Button>
                </div>
              </div>
              <Progress value={Math.min(b.percentUsed, 100)} />
              <p className="text-sm text-muted-foreground">
                {currencyFormatter.format(b.spent)} / {currencyFormatter.format(b.monthlyLimit)}
                {" · "}
                {currencyFormatter.format(b.remaining)} restant
                {" · "}
                projection {currencyFormatter.format(b.projectedMonthEnd)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simuler un achat</CardTitle>
          <CardDescription>
            Vérifie l&apos;impact d&apos;une dépense avant de la faire.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            onSubmit={handleSimulate}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Label>Catégorie</Label>
              <Select value={simCategoryId} onValueChange={(v) => setSimCategoryId(v ?? GLOBAL)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: unknown) =>
                      value === GLOBAL ? "Toutes catégories" : categoryName(value as string)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GLOBAL}>Toutes catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sim-amount">Montant (€)</Label>
              <Input
                id="sim-amount"
                type="number"
                min="1"
                step="1"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={simulating}>
              {simulating ? "Simulation..." : "Simuler"}
            </Button>
          </form>

          {simResult && (
            <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm text-muted-foreground">
              <p>
                Dépensé avant : {currencyFormatter.format(simResult.spentBeforePurchase)} → après :{" "}
                {currencyFormatter.format(simResult.spentAfterPurchase)}
              </p>
              <p>
                Projection fin de mois après achat :{" "}
                {currencyFormatter.format(simResult.projectedMonthEndAfterPurchase)}
              </p>
              {simResult.budgetLimit === null ? (
                <p>Aucun budget défini pour cette catégorie.</p>
              ) : (
                <>
                  {simResult.wouldExceedBudget && (
                    <p className="font-medium text-destructive">
                      Cet achat dépasserait le budget ({currencyFormatter.format(simResult.budgetLimit)}).
                    </p>
                  )}
                  {!simResult.wouldExceedBudget && simResult.wouldExceedProjectedBudget && (
                    <p className="font-medium text-destructive">
                      Le budget resterait respecté mais la projection de fin de mois le dépasserait.
                    </p>
                  )}
                  {!simResult.wouldExceedBudget && !simResult.wouldExceedProjectedBudget && (
                    <p>Dans les clous, même en projection.</p>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
