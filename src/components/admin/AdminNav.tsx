"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";

const ITEMS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/tournois", label: "Tournois" },
  { href: "/admin/joueurs", label: "Joueurs" },
  { href: "/admin/saisons", label: "Saisons" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <Tabs
      items={ITEMS.map((i) => ({
        ...i,
        active: i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href),
      }))}
    />
  );
}
