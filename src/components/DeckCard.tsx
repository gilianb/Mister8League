/* eslint-disable @next/next/no-img-element */
import type { DeckWithLeader } from "@/lib/db/decks";
import { Badge } from "./ui/Badge";
import { formatDateShort } from "@/lib/format";

export default function DeckCard({ deck, actions, showVisibility = false }: { deck: DeckWithLeader; actions?: React.ReactNode; showVisibility?: boolean }) {
  const leader = deck.leader;
  return (
    <article className="surface-panel flex overflow-hidden">
      <div className="relative w-24 shrink-0 bg-coal-950 sm:w-28">
        {leader?.image_url ? (
          <img src={leader.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 20%" }} loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-cream-600">Sans leader</div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold tracking-tight text-cream-100">{deck.name}</h3>
            <p className="truncate text-xs text-cream-500">
              {leader ? `${leader.name}${leader.code ? `, ${leader.code}` : ""}` : "Leader non renseigné"}
              {leader?.colors?.length ? `, ${leader.colors.join(" / ")}` : ""}
            </p>
          </div>
          {showVisibility && <Badge tone={deck.is_public ? "gold" : "neutral"}>{deck.is_public ? "Public" : "Privé"}</Badge>}
        </div>
        {deck.notes && <p className="line-clamp-2 text-sm leading-relaxed text-cream-300">{deck.notes}</p>}
        {deck.decklist_text && (
          <details className="text-xs text-cream-400">
            <summary className="cursor-pointer font-medium text-gold-400 hover:underline">Voir la decklist</summary>
            <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-control bg-coal-950 p-3 font-mono text-[11px] leading-relaxed text-cream-300">
              {deck.decklist_text}
            </pre>
          </details>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-[11px] text-cream-600">Mis à jour le {formatDateShort(deck.updated_at)}</span>
          {actions}
        </div>
      </div>
    </article>
  );
}
