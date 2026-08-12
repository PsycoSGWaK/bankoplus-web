"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

/** Redirige vers /login tant que la session n'est pas authentifiée (après la restauration silencieuse). */
export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  return { isReady: !isLoading && isAuthenticated };
}
