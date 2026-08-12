"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { MfaSetupStep } from "@/components/auth/MfaSetupStep";
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
import Link from "next/link";

const PASSWORD_RULES =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{12,128}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mfaSetupToken, setMfaSetupToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!PASSWORD_RULES.test(password)) {
      setError(
        "Le mot de passe doit faire 12 à 128 caractères et contenir une minuscule, une majuscule, un chiffre et un caractère spécial.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await register(email, password);
      setMfaSetupToken(res.mfaSetupToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mfaSetupToken ? "Double authentification" : "Créer un compte"}</CardTitle>
          <CardDescription>
            {mfaSetupToken
              ? "Dernière étape avant de pouvoir utiliser Banko+."
              : "Renseigne un email et un mot de passe pour commencer."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mfaSetupToken ? (
            <MfaSetupStep
              mfaSetupToken={mfaSetupToken}
              onComplete={() => router.push("/login")}
            />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer mon compte"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Déjà un compte ?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Se connecter
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
