"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, verifyLogin } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
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

type Step =
  | { name: "credentials" }
  | { name: "mfa_challenge"; token: string }
  | { name: "mfa_setup"; token: string };

export default function LoginPage() {
  const router = useRouter();
  const { setAccessToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>({ name: "credentials" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.status === "mfa_challenge_required") {
        setStep({ name: "mfa_challenge", token: res.token });
      } else {
        setStep({ name: "mfa_setup", token: res.token });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step.name !== "mfa_challenge") return;
    setError(null);
    setLoading(true);
    try {
      const res = await verifyLogin(step.token, code);
      setAccessToken(res.accessToken);
      router.push("/dashboard");
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
          <CardTitle>
            {step.name === "credentials" && "Connexion"}
            {step.name === "mfa_challenge" && "Code de vérification"}
            {step.name === "mfa_setup" && "Double authentification"}
          </CardTitle>
          <CardDescription>
            {step.name === "credentials" && "Connecte-toi à ton compte Banko+."}
            {step.name === "mfa_challenge" &&
              "Saisis le code généré par ton application d'authentification."}
            {step.name === "mfa_setup" &&
              "Ton inscription n'a pas été finalisée, configure d'abord la double authentification."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step.name === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
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
                  autoComplete="current-password"
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
                {loading ? "Connexion..." : "Continuer"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link href="/register" className="underline underline-offset-4">
                  S&apos;inscrire
                </Link>
              </p>
            </form>
          )}

          {step.name === "mfa_challenge" && (
            <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mfa-code">Code à 6 chiffres</Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "Vérification..." : "Se connecter"}
              </Button>
            </form>
          )}

          {step.name === "mfa_setup" && (
            <MfaSetupStep
              mfaSetupToken={step.token}
              onComplete={() => {
                setStep({ name: "credentials" });
                setPassword("");
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
