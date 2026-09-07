"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteDeckAction } from "@/lib/decks/actions";
import { IconEdit, IconTrash } from "@/components/ui/icons";

export default function DeckActions({ deckId, deckName }: { deckId: string; deckName: string }) {
  const [pending, start] = useTransition();
  return (
    <span className="flex items-center gap-1">
      <Link href={`/joueur/decks?edit=${deckId}`} className="rounded-control p-1.5 text-cream-400 transition-colors hover:bg-cream-100/6 hover:text-gold-300" aria-label={`Modifier ${deckName}`}>
        <IconEdit size={16} />
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Supprimer le deck « ${deckName} » ?`)) {
            start(async () => {
              await deleteDeckAction(deckId);
            });
          }
        }}
        className="rounded-control p-1.5 text-cream-400 transition-colors hover:bg-cream-100/6 hover:text-red-300 disabled:opacity-50"
        aria-label={`Supprimer ${deckName}`}
      >
        <IconTrash size={16} />
      </button>
    </span>
  );
}
