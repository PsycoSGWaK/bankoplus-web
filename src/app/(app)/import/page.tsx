"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getAccounts } from "@/lib/api/accounts";
import { importStatement } from "@/lib/api/import";
import { ApiError } from "@/lib/api/client";
import type { Account, ImportBatch } from "@/types/api";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

const STATUS_LABEL: Record<ImportBatch["status"], string> = {
  completed: "Import terminé",
  partial: "Import partiel",
  failed: "Import échoué",
};

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [accountId, setAccountId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportBatch | null>(null);

  useEffect(() => {
    getAccounts()
      .then((accs) => {
        setAccounts(accs);
        if (accs.length > 0) setAccountId(accs[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId || !file) return;
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const batch = await importStatement(accountId, file);
      setResult(batch);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (batch.status === "completed") {
        toast.success(`${batch.importedRows} transactions importées.`);
      } else if (batch.status === "partial") {
        toast.warning(`${batch.importedRows}/${batch.totalRows} lignes importées, ${batch.failedRows} en échec.`);
      } else {
        toast.error("L'import a échoué.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setSubmitting(false);
    }
  }

  if (accounts !== null && accounts.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">
          Crée d&apos;abord un compte pour pouvoir y importer un relevé.
        </p>
        <Link href="/accounts" className={buttonVariants()}>
          Créer un compte
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Importer un relevé</CardTitle>
          <CardDescription>Fichier .csv ou .pdf, 10 Mo maximum.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Compte</Label>
              <Select value={accountId} onValueChange={(value) => setAccountId(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un compte">
                    {(value: unknown) =>
                      accounts?.find((account) => account.id === value)?.label ??
                      "Choisir un compte"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="file">Fichier</Label>
              <input
                id="file"
                ref={fileInputRef}
                type="file"
                accept=".csv,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className="text-sm file:mr-3 file:rounded-md file:border file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={submitting || !accountId || !file}>
              {submitting ? "Import en cours..." : "Importer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>{STATUS_LABEL[result.status]}</CardTitle>
            <CardDescription>{result.filename}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
            <p>{result.totalRows} lignes détectées</p>
            <p>{result.importedRows} transactions importées</p>
            {result.failedRows > 0 && <p>{result.failedRows} lignes en échec</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
