/* eslint-disable @next/next/no-img-element */
import type { DeckWithLeader } from "@/lib/db/decks";
import { Badge } from "./ui/Badge";
import { formatDateShort } from "@/lib/format";

export default function DeckCard({ deck, actions, showVisibility = false }: { deck: DeckWithLeader; actions?: React.ReactNode; showVisibility?: boolean }) {
  const leader = deck.leader;
  return (
    <article className="rounded-2xl border hairline bg-coal-800 overflow-hidden flex">
      <div className="w-24 sm:w-28 shrink-0 bg-coal-900 relative">
        {leader?.image_url ? (
          <img src={leader.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 20%" }} loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-cream-600 text-xs">Sans leader</div>
        )}
      </div>
      <div className="flex-1 min-w-0 p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-cream-100 truncate">{deck.name}</h3>
            <p className="text-xs text-cream-400 truncate">
              {leader ? `${leader.name}${leader.code ? ` · ${leader.code}` : ""}` : "Leader non renseigné"}
              {leader?.colors?.length ? ` · ${leader.colors.join(" / ")}` : ""}
            </p>
          </div>
          {showVisibility && <Badge tone={deck.is_public ? "gold" : "neutral"}>{deck.is_public ? "Public" : "Privé"}</Badge>}
        </div>
        {deck.notes && <p className="text-sm text-cream-300 line-clamp-2">{deck.notes}</p>}
        {deck.decklist_text && (
          <details className="text-xs text-cream-400">
            <summary className="cursor-pointer text-gold-400 hover:underline">Voir la decklist</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-cream-300 max-h-64 overflow-y-auto">{deck.decklist_text}</pre>
          </details>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] text-cream-600">Mis à jour le {formatDateShort(deck.updated_at)}</span>
          {actions}
        </div>
      </div>
    </article>
  );
}
