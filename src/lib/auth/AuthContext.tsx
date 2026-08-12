"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { getAccessToken, setAccessToken, subscribeToAccessToken } from "@/lib/auth/token";
import { refreshAccessToken } from "@/lib/api/client";

interface AuthContextValue {
  accessToken: string | null;
  isAuthenticated: boolean;
  /** true tant que la tentative de restauration de session (au chargement) n'est pas terminée. */
  isLoading: boolean;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useSyncExternalStore(
    subscribeToAccessToken,
    getAccessToken,
    () => null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Le token vit en mémoire donc il est perdu à chaque rechargement de page :
  // on tente un refresh silencieux via le cookie httpOnly pour restaurer la
  // session sans repasser par le login si elle est encore valide.
  useEffect(() => {
    refreshAccessToken()
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const value: AuthContextValue = {
    accessToken,
    isAuthenticated: accessToken !== null,
    isLoading,
    setAccessToken,
    logout: () => setAccessToken(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  return ctx;
}
