"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { logout as logoutRequest } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/accounts", label: "Comptes" },
  { href: "/transactions", label: "Transactions" },
  { href: "/import", label: "Import" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await logoutRequest().catch(() => {});
    logout();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <nav className="flex items-center gap-4">
        <span className="font-semibold">Banko+</span>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm text-muted-foreground hover:text-foreground",
              pathname === link.href && "text-foreground font-medium",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Se déconnecter
      </Button>
    </header>
  );
}
