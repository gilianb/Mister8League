import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/db/events";
import { getEventResults } from "@/lib/db/results";
import { listLeaders, toLeaderOptions } from "@/lib/db/leaders";
import { getPendingImport } from "@/lib/league/import";
import { formatDateTime, placementLabel } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import ResultsUploadForm from "@/components/admin/ResultsUploadForm";
import ImportRowsTable from "@/components/admin/ImportRowsTable";
import UnpublishResultsButton from "@/components/admin/UnpublishResultsButton";

export const metadata: Metadata = { title: "Résultats · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminResultatsPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();
  const [pending, leaders, results] = await Promise.all([getPendingImport(event.id), listLeaders(), getEventResults(event.id)]);
  const published = event.status === "completed" && results.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/admin/tournois/${event.id}`}
        backLabel="Fiche du tournoi"
        eyebrow={
          <span className="inline-flex items-center gap-2">
            {formatDateTime(event.starts_at)}
            {published && <Badge tone="gold">Résultats publiés</Badge>}
          </span>
        }
        title={`Résultats · ${event.title}`}
        actions={
          published ? (
            <>
              <Button href={`/resultats/${event.slug}`} variant="outline" size="sm">
                Page publique
              </Button>
              <UnpublishResultsButton eventId={event.id} />
            </>
          ) : undefined
        }
      />

      {!event.counts_for_league && <Alert tone="info">Ce tournoi est hors ligue : les résultats seront publiés sans points de classement.</Alert>}
      {!event.season_id && event.counts_for_league && (
        <Alert tone="warn">
          Ce tournoi n&apos;est rattaché à aucune saison : aucun point de ligue ne sera attribué.{" "}
          <Link href={`/admin/tournois/${event.id}`} className="underline">
            Modifier le tournoi
          </Link>
        </Alert>
      )}

      {pending ? (
        <>
          <Alert tone="info" title={`Import en attente : ${pending.imp.file_name ?? "CSV"} (${pending.imp.rounds ?? "?"} rondes)`}>
            Vérifiez le rapprochement des joueurs et les leaders, puis publiez. Vous pouvez aussi ré-importer un autre fichier : il remplacera cet import.
          </Alert>
          <ImportRowsTable importId={pending.imp.id} rows={pending.rows} noShows={pending.noShows} leaders={toLeaderOptions(leaders)} />
          <details className="text-sm">
            <summary className="cursor-pointer text-gold-400 underline-offset-4 hover:underline">Importer un autre fichier</summary>
            <div className="mt-3">
              <ResultsUploadForm eventId={event.id} defaultRounds={pending.imp.rounds ?? event.rounds} />
            </div>
          </details>
        </>
      ) : (
        <ResultsUploadForm eventId={event.id} defaultRounds={event.rounds} />
      )}

      {published && !pending && (
        <Card>
          <h2 className="font-display text-xl font-medium tracking-tight text-cream-100 mb-3">Classement publié ({results.length} joueurs)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-head border-b hairline text-left">
                  <th className="px-2 py-2 font-semibold">#</th>
                  <th className="px-2 py-2 font-semibold">Joueur</th>
                  <th className="px-2 py-2 font-semibold">Leader</th>
                  <th className="px-2 py-2 font-semibold text-right">Bilan</th>
                  <th className="px-2 py-2 font-semibold text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {results.map((r) => (
                  <tr key={r.result_id}>
                    <td className="px-2 py-1.5 font-semibold text-cream-100 tabular">{placementLabel(r.placement)}</td>
                    <td className="px-2 py-1.5 text-cream-100">
                      {r.display_name}
                      {!r.profile_id && <span className="ml-2 text-[10px] text-cream-600">sans compte</span>}
                    </td>
                    <td className="px-2 py-1.5 text-cream-400">{r.leader_name ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right tabular text-cream-400">
                      {r.wins ?? 0}-{r.losses ?? 0}
                      {(r.draws ?? 0) > 0 ? `-${r.draws}` : ""}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold text-cream-100 tabular">+{r.league_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-cream-600 mt-3">Pour corriger un leader ou un joueur, ré-importez le CSV : le rapprochement est conservé pour les joueurs connus.</p>
        </Card>
      )}
    </div>
  );
}
