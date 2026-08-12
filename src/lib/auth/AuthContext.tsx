"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { getAccessToken, setAccessToken, subscribeToAccessToken } from "@/lib/auth/token";

interface AuthContextValue {
  accessToken: string | null;
  isAuthenticated: boolean;
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

  const value: AuthContextValue = {
    accessToken,
    isAuthenticated: accessToken !== null,
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
