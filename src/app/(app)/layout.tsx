"use client";

import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { AppHeader } from "@/components/layout/AppHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isReady } = useRequireAuth();

  if (!isReady) return null;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </div>
  );
}
