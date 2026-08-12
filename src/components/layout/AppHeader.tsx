"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { logout as logoutRequest } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/accounts", label: "Comptes" },
  { href: "/transactions", label: "Transactions" },
  { href: "/import", label: "Import" },
  { href: "/budgets", label: "Budgets" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logoutRequest().catch(() => {});
    logout();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
      <div className="flex items-center gap-6">
        <span className="font-semibold">Banko+</span>
        <nav className="hidden items-center gap-4 md:flex">
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
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={handleLogout}>
          Se déconnecter
        </Button>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
            <span className="sr-only">Menu</span>
          </Button>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Banko+</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                    pathname === link.href && "bg-muted text-foreground font-medium",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 p-4">
              <Button variant="outline" onClick={handleLogout}>
                Se déconnecter
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
