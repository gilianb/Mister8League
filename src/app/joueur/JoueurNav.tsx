"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";

const ITEMS = [
  { href: "/joueur", label: "Tableau de bord" },
  { href: "/joueur/inscriptions", label: "Mes inscriptions" },
  { href: "/joueur/decks", label: "Mes decks" },
  { href: "/joueur/profil", label: "Mon profil" },
];

export default function JoueurNav() {
  const pathname = usePathname();
  return (
    <div className="mb-8 overflow-x-auto">
      <Tabs items={ITEMS.map((i) => ({ ...i, active: i.href === "/joueur" ? pathname === "/joueur" : pathname.startsWith(i.href) }))} />
    </div>
  );
}
