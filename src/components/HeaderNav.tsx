"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import HatLogo from "./HatLogo";
import UserMenu from "./UserMenu";
import { Button } from "./ui/Button";
import { IconMenu, IconX } from "./ui/icons";
import { cn } from "@/lib/cn";

export type HeaderUser = {
  email: string | null;
  pseudo: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  incomplete: boolean;
};

const LINKS = [
  { href: "/calendrier", label: "Tournois" },
  { href: "/classement", label: "Classement" },
  { href: "/resultats", label: "Résultats" },
  { href: "/reglement", label: "Règlement" },
];

export default function HeaderNav({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b hairline bg-coal-950/92 backdrop-blur-md">
      <div className="page-shell flex h-18 items-center gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="Mister 8 Tournament League, accueil">
          <HatLogo className="w-11" priority />
          <span className="leading-none">
            <span className="block font-display text-[19px] font-semibold tracking-[-0.01em] text-cream-100">Mister 8</span>
            <span className="mt-1 block text-[11px] font-medium text-gold-400">Tournament League</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative text-[15px] font-medium transition-colors",
                isActive(l.href)
                  ? "text-cream-100 after:absolute after:inset-x-0 after:-bottom-[25px] after:h-0.5 after:bg-gold-400"
                  : "text-cream-400 hover:text-cream-100"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Link href="/connexion" className="hidden text-[15px] font-medium text-cream-300 transition-colors hover:text-cream-100 sm:inline">
                Connexion
              </Link>
              <Button href="/connexion?mode=inscription" size="sm" className="hidden sm:inline-flex">
                Créer un compte
              </Button>
            </>
          )}
          <button
            className="-mr-2 rounded-control p-2 text-cream-100 md:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <IconX size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t hairline bg-coal-950 md:hidden" aria-label="Navigation mobile">
          <div className="page-shell flex flex-col py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "border-b hairline py-4 font-display text-2xl font-medium tracking-tight last:border-0",
                  isActive(l.href) ? "text-gold-300" : "text-cream-100"
                )}
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <div className="mt-4 mb-2 grid grid-cols-2 gap-2">
                <Button href="/connexion" variant="outline">
                  Connexion
                </Button>
                <Button href="/connexion?mode=inscription">Créer un compte</Button>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
