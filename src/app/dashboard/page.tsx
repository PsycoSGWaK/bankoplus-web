"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { logout as logoutRequest } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  async function handleLogout() {
    await logoutRequest().catch(() => {});
    logout();
    router.push("/login");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <p className="text-lg">Tu es connecté à Banko+.</p>
      <Button variant="outline" onClick={handleLogout}>
        Se déconnecter
      </Button>
    </div>
  );
}
