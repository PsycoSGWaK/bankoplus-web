"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createAccount, getAccounts, updateAccountBalance } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import type { Account } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

function today() {
  return new Date().toISOString().slice(0, 10);
}

function AccountCard({
  account,
  onUpdated,
}: {
  account: Account;
  onUpdated: (account: Account) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [balance, setBalance] = useState(account.referenceBalance?.toString() ?? "");
  const [date, setDate] = useState(account.referenceDate ?? today());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const referenceBalance = Number(balance);
    if (Number.isNaN(referenceBalance)) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await updateAccountBalance(account.id, { referenceBalance, referenceDate: date });
      onUpdated(updated);
      setEditing(false);
      toast.success("Solde mis à jour.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{account.label}</p>
            {account.bankName && (
              <p className="text-sm text-muted-foreground">{account.bankName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              {account.currentBalance !== null ? (
                <p className="font-medium">{currencyFormatter.format(account.currentBalance)}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Solde inconnu</p>
              )}
              {account.referenceDate && (
                <p className="text-xs text-muted-foreground">
                  au {dateFormatter.format(new Date(account.referenceDate))}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)}>
              {account.currentBalance !== null ? "Modifier" : "Définir le solde"}
            </Button>
          </div>
        </div>

        {editing && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t pt-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor={`balance-${account.id}`}>Solde connu (€)</Label>
              <Input
                id={`balance-${account.id}`}
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`date-${account.id}`}>À cette date</Label>
              <Input
                id={`date-${account.id}`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [bankName, setBankName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function loadAccounts() {
    getAccounts()
      .then(setAccounts)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Erreur inattendue"));
  }

  useEffect(loadAccounts, []);

  function handleAccountUpdated(updated: Account) {
    setAccounts((prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? prev);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const account = await createAccount({
        label,
        bankName: bankName.trim() ? bankName.trim() : undefined,
      });
      setAccounts((prev) => (prev ? [...prev, account] : [account]));
      setLabel("");
      setBankName("");
      toast.success(`Compte "${account.label}" créé.`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Nouveau compte</CardTitle>
          <CardDescription>
            Juste un libellé pour t&apos;organiser — pas de RIB/IBAN à saisir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="label">Libellé</Label>
              <Input
                id="label"
                placeholder="Compte courant"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="bankName">Banque (optionnel)</Label>
              <Input
                id="bankName"
                placeholder="Ma banque"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Ajout..." : "Ajouter"}
            </Button>
          </form>
          {formError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {loadError && (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {accounts === null && !loadError && (
          <p className="text-sm text-muted-foreground">Chargement des comptes...</p>
        )}

        {accounts !== null && accounts.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun compte pour le moment.</p>
        )}

        {accounts?.map((account) => (
          <AccountCard key={account.id} account={account} onUpdated={handleAccountUpdated} />
        ))}
      </div>
    </div>
  );
}
