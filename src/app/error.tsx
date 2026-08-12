"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-2xl font-semibold">Une erreur est survenue</p>
      <p className="max-w-md text-muted-foreground">{error.message || "Erreur inattendue."}</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
