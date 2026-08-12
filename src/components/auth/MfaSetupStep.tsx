"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { enableMfa, setupMfa } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MfaSetupStepProps {
  mfaSetupToken: string;
  onComplete: () => void;
}

export function MfaSetupStep({ mfaSetupToken, onComplete }: MfaSetupStepProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // /mfa/setup génère et persiste un nouveau secret à chaque appel : en React
  // Strict Mode (dev), les effets s'exécutent deux fois au montage, ce qui
  // déclenchait deux appels et désynchronisait le QR code affiché du secret
  // réellement stocké côté serveur. Cette ref garantit un seul appel réel.
  const hasRequestedSetup = useRef(false);

  useEffect(() => {
    if (hasRequestedSetup.current) return;
    hasRequestedSetup.current = true;

    setupMfa(mfaSetupToken)
      .then((res) => {
        setQrCodeDataUrl(res.qrCodeDataUrl);
        setSecret(res.secret);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erreur inattendue"));
  }, [mfaSetupToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await enableMfa(mfaSetupToken, code);
      onComplete();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Scanne ce QR code avec ton application d&apos;authentification (Google
        Authenticator, etc.), ou saisis la clé manuellement.
      </p>

      {qrCodeDataUrl && (
        <div className="flex justify-center">
          <Image src={qrCodeDataUrl} alt="QR code MFA" width={200} height={200} unoptimized />
        </div>
      )}

      {secret && (
        <p className="text-center font-mono text-xs break-all text-muted-foreground">
          {secret}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        <Button type="submit" disabled={loading || !qrCodeDataUrl}>
          {loading ? "Validation..." : "Activer la double authentification"}
        </Button>
      </form>
    </div>
  );
}
