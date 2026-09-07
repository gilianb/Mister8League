"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/lib/auth/actions";
import type { HeaderUser } from "./HeaderNav";
import { Avatar } from "./ui/Avatar";
import { IconCards, IconLogout, IconShield, IconTicket, IconUser, IconWarning } from "./ui/icons";

const itemClass =
  "flex items-center gap-3 px-4 py-2.5 text-sm text-cream-200 transition-colors hover:bg-cream-100/6 hover:text-cream-100";

export default function UserMenu({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = user.pseudo ?? user.email ?? "Joueur";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-cream-100/15 py-1 pl-1 pr-3 transition-colors hover:border-gold-400/60"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar src={user.avatarUrl} name={name} size={30} />
        <span className="hidden max-w-32 truncate text-sm font-medium text-cream-100 sm:inline">{name}</span>
        {user.incomplete && <span className="size-2 rounded-full bg-brand" title="Profil à compléter" />}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-panel border hairline bg-coal-800 py-2 shadow-[0_24px_60px_rgba(0,0,0,.55)]"
        >
          <div className="mb-1 border-b hairline px-4 pb-3">
            <p className="truncate text-sm font-semibold text-cream-100">{name}</p>
            {user.email && <p className="truncate text-xs text-cream-500">{user.email}</p>}
          </div>
          {user.incomplete && (
            <Link href="/joueur/profil" className={`${itemClass} text-amber-200`} onClick={() => setOpen(false)}>
              <IconWarning size={16} /> Compléter mon profil
            </Link>
          )}
          <Link href="/joueur" className={itemClass} onClick={() => setOpen(false)}>
            <IconUser size={16} /> Mon espace
          </Link>
          <Link href="/joueur/inscriptions" className={itemClass} onClick={() => setOpen(false)}>
            <IconTicket size={16} /> Mes inscriptions
          </Link>
          <Link href="/joueur/decks" className={itemClass} onClick={() => setOpen(false)}>
            <IconCards size={16} /> Mes decks
          </Link>
          {user.isAdmin && (
            <Link href="/admin" className={`${itemClass} text-gold-300`} onClick={() => setOpen(false)}>
              <IconShield size={16} /> Administration
            </Link>
          )}
          <form action={signOutAction} className="mt-1 border-t hairline pt-1">
            <button type="submit" className={`${itemClass} w-full text-left text-red-300 hover:text-red-200`}>
              <IconLogout size={16} /> Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
