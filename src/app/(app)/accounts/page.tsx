"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createAccount, getAccounts } from "@/lib/api/accounts";
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
          <Card key={account.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{account.label}</p>
                {account.bankName && (
                  <p className="text-sm text-muted-foreground">{account.bankName}</p>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{account.currency}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
