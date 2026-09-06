"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteDeckAction } from "@/lib/decks/actions";
import { IconEdit, IconTrash } from "@/components/ui/icons";

export default function DeckActions({ deckId, deckName }: { deckId: string; deckName: string }) {
  const [pending, start] = useTransition();
  return (
    <span className="flex items-center gap-1">
      <Link href={`/joueur/decks?edit=${deckId}`} className="p-1.5 rounded-md text-cream-400 hover:text-gold-400 hover:bg-coal-700/60" aria-label={`Modifier ${deckName}`}>
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
        className="p-1.5 rounded-md text-cream-400 hover:text-red-300 hover:bg-coal-700/60 disabled:opacity-50"
        aria-label={`Supprimer ${deckName}`}
      >
        <IconTrash size={16} />
      </button>
    </span>
  );
}
