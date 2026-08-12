"use client";

import { useEffect, useState } from "react";
import { getAccounts } from "@/lib/api/accounts";
import { getCategories } from "@/lib/api/categories";
import { getTransactions, updateTransactionCategory } from "@/lib/api/transactions";
import { ApiError } from "@/lib/api/client";
import type { Account, Category, Transaction } from "@/types/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_ACCOUNTS = "all";
const NO_CATEGORY = "none";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [accountFilter, setAccountFilter] = useState(ALL_ACCOUNTS);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
  }, []);

  useEffect(() => {
    // Garde la liste précédente affichée pendant le chargement du nouveau
    // filtre plutôt que de la vider (pas de flash de "chargement...").
    getTransactions(accountFilter === ALL_ACCOUNTS ? undefined : accountFilter)
      .then((txs) => setTransactions([...txs].sort((a, b) => b.date.localeCompare(a.date))))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
  }, [accountFilter]);

  async function handleCategoryChange(transaction: Transaction, value: string | null) {
    const categoryId = value === NO_CATEGORY || value === null ? null : value;
    setUpdatingId(transaction.id);
    setError(null);
    try {
      const updated = await updateTransactionCategory(transaction.id, categoryId);
      setTransactions(
        (prev) => prev?.map((tx) => (tx.id === updated.id ? updated : tx)) ?? prev,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setUpdatingId(null);
    }
  }

  const accountLabel = (accountId: string) =>
    accounts.find((a) => a.id === accountId)?.label ?? accountId;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Transactions</h1>
        <Select value={accountFilter} onValueChange={(v) => setAccountFilter(v ?? ALL_ACCOUNTS)}>
          <SelectTrigger className="w-56">
            <SelectValue>
              {(value: unknown) =>
                value === ALL_ACCOUNTS
                  ? "Tous les comptes"
                  : accountLabel(value as string)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ACCOUNTS}>Tous les comptes</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {transactions === null && !error && (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      )}

      {transactions !== null && transactions.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune transaction pour le moment.</p>
      )}

      <div className="flex flex-col divide-y rounded-lg border">
        {transactions?.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{tx.label}</span>
              <span className="text-xs text-muted-foreground">
                {dateFormatter.format(new Date(tx.date))}
                {accountFilter === ALL_ACCOUNTS && ` · ${accountLabel(tx.accountId)}`}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Select
                value={tx.categoryId ?? NO_CATEGORY}
                onValueChange={(v) => handleCategoryChange(tx, v)}
                disabled={updatingId === tx.id}
              >
                <SelectTrigger className="w-44" size="sm">
                  <SelectValue>
                    {(value: unknown) =>
                      value === NO_CATEGORY
                        ? "Non catégorisé"
                        : (categories.find((c) => c.id === value)?.name ?? "Non catégorisé")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>Non catégorisé</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span
                className={
                  "w-24 text-right font-medium " +
                  (tx.amount >= 0 ? "text-green-600" : "text-red-600")
                }
              >
                {currencyFormatter.format(tx.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
