"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/joueur", label: "Tableau de bord" },
  { href: "/joueur/inscriptions", label: "Mes inscriptions" },
  { href: "/joueur/decks", label: "Mes decks" },
  { href: "/joueur/profil", label: "Mon profil" },
];

/** Navigation de l'espace joueur : onglets sur mobile, colonne sur desktop. */
export default function JoueurNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Espace joueur" className="-mx-5 flex overflow-x-auto border-b hairline px-5 sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible lg:border-b-0">
      {ITEMS.map((item) => {
        const active = item.href === "/joueur" ? pathname === "/joueur" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors first:pl-0 lg:mb-0 lg:border-b-0 lg:border-l-2 lg:px-4 lg:py-2.5 lg:first:pl-4",
              active ? "border-gold-400 text-cream-100" : "border-transparent text-cream-500 hover:text-cream-100 lg:border-cream-100/10"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
