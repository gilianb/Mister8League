"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import HatLogo from "./HatLogo";

const links = [
  { href: "/calendrier", label: "Calendrier" },
  { href: "/classement", label: "Classement" },
  { href: "/resultats", label: "Résultats" },
  { href: "/reglement", label: "Règlement" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-coal-950/95 backdrop-blur border-b hairline">
      <div className="mx-auto max-w-6xl px-4 flex items-center gap-6 h-16">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
          <HatLogo className="w-9" />
          <span className="leading-none">
            <span className="block font-display font-bold tracking-wide text-cream-100 text-lg">
              MISTER 8
            </span>
            <span className="block text-[9px] tracking-[0.28em] text-gold-400 font-semibold">
              TOURNAMENT LEAGUE
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                pathname.startsWith(l.href)
                  ? "text-gold-400 font-semibold"
                  : "text-cream-400 hover:text-cream-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/joueur"
            className="hidden sm:inline-block rounded-full border border-gold-400/60 px-4 py-1.5 text-sm text-gold-400 hover:bg-gold-400 hover:text-coal-950 font-medium transition-colors"
          >
            Mon espace
          </Link>
          <button
            className="md:hidden text-cream-100 p-2"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M4 4l14 14M18 4L4 18" />
              ) : (
                <path d="M3 6h16M3 11h16M3 16h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t hairline bg-coal-950 px-4 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`py-2.5 text-base border-b hairline last:border-0 ${
                pathname.startsWith(l.href) ? "text-gold-400 font-semibold" : "text-cream-200"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/joueur"
            onClick={() => setOpen(false)}
            className="mt-2 mb-1 text-center rounded-full border border-gold-400/60 px-4 py-2 text-gold-400 font-medium"
          >
            Mon espace
          </Link>
        </nav>
      )}
    </header>
  );
}
