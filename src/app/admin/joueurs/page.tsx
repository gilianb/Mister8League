import type { Metadata } from "next";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatTile } from "@/components/ui/StatTile";
import PlayersTable, { type AdminPlayerRow } from "@/components/admin/PlayersTable";

export const metadata: Metadata = { title: "Joueurs · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

type Raw = {
  id: string;
  display_name: string;
  bandai_member_id: string | null;
  profile_id: string | null;
  profile: { pseudo: string | null; full_name: string | null } | null;
  results: Array<{ league_points: number }>;
};

export default async function AdminJoueursPage() {
  const admin = createAdminSupabase();
  const [{ data: raw }, { count: profilesCount }, { count: incompleteCount }] = await Promise.all([
    admin
      .from("players")
      .select("id, display_name, bandai_member_id, profile_id, profile:profiles(pseudo, full_name), results(league_points)")
      .is("merged_into", null)
      .order("display_name", { ascending: true })
      .returns<Raw[]>(),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).or("bandai_member_id.is.null,pseudo.is.null"),
  ]);

  const rows: AdminPlayerRow[] = (raw ?? []).map((p) => ({
    id: p.id,
    display_name: p.display_name,
    bandai_member_id: p.bandai_member_id,
    profile_id: p.profile_id,
    pseudo: p.profile?.pseudo ?? null,
    full_name: p.profile?.full_name ?? null,
    results_count: p.results?.length ?? 0,
    total_points: (p.results ?? []).reduce((s, r) => s + (r.league_points ?? 0), 0),
  }));
  const noAccount = rows.filter((r) => !r.profile_id).length;

  return (
    <div className="space-y-6">
      <SectionHeading as="h1" size="lg" title="Joueurs" />
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile value={rows.length} label="Identités ligue" sub="joueurs ayant des résultats ou un compte" />
        <StatTile value={profilesCount ?? 0} label="Comptes créés" />
        <StatTile value={noAccount} label="Sans compte" sub="importés depuis un CSV" accent={noAccount ? "brand" : "gold"} />
        <StatTile value={incompleteCount ?? 0} label="Profils incomplets" sub="pseudo ou ID Bandai manquant" />
      </section>
      <p className="text-sm text-cream-400 max-w-[70ch]">
        Une identité « ligue » regroupe les résultats d&apos;un joueur (clé : numéro de membre Bandai). Quand un joueur importé crée son compte avec le même numéro, le
        rattachement est automatique. Sinon, rattachez ou fusionnez ici.
      </p>
      <PlayersTable rows={rows} />
    </div>
  );
}
