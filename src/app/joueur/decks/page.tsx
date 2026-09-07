import type { Metadata } from "next";
import { listMyDecks } from "@/lib/db/decks";
import { listLeaders, toLeaderOptions } from "@/lib/db/leaders";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import DeckCard from "@/components/DeckCard";
import DeckForm from "./DeckForm";
import DeckActions from "./DeckActions";

export const metadata: Metadata = { title: "Mes decks", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ msg?: string; edit?: string; nouveau?: string }> };

export default async function DecksPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [decks, leaders] = await Promise.all([listMyDecks(), listLeaders()]);
  const options = toLeaderOptions(leaders);
  const editing = sp.edit ? (decks.find((d) => d.id === sp.edit) ?? null) : null;
  const showForm = Boolean(editing || sp.nouveau !== undefined || decks.length === 0);

  return (
    <div className="space-y-8">
      <PageHeader
        size="md"
        className="mb-0"
        title="Mes decks"
        lede="Enregistrez vos decks pour les déclarer en un clic à l'inscription. Les decks publics apparaissent sur votre profil."
        actions={!showForm ? <Button href="/joueur/decks?nouveau">Nouveau deck</Button> : undefined}
      />

      {sp.msg === "enregistre" && <Alert tone="success">Deck enregistré.</Alert>}
      {sp.msg === "supprime" && <Alert tone="success">Deck supprimé.</Alert>}

      {showForm && (
        <DeckForm
          key={editing?.id ?? "new"}
          leaders={options}
          deck={
            editing
              ? {
                  id: editing.id,
                  name: editing.name,
                  leader_id: editing.leader_id,
                  decklist_text: editing.decklist_text ?? "",
                  notes: editing.notes ?? "",
                  is_public: editing.is_public,
                }
              : null
          }
        />
      )}

      {decks.length === 0 ? (
        !showForm && <EmptyState title="Aucun deck enregistré" text="Ajoutez votre premier deck : un nom, un leader, et si vous voulez la decklist." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {decks.map((d) => (
            <DeckCard key={d.id} deck={d} showVisibility actions={<DeckActions deckId={d.id} deckName={d.name} />} />
          ))}
        </div>
      )}
    </div>
  );
}
