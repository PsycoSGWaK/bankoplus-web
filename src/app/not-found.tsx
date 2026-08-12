import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-2xl font-semibold">404</p>
      <p className="text-muted-foreground">Cette page n&apos;existe pas.</p>
      <Link href="/" className={buttonVariants()}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
