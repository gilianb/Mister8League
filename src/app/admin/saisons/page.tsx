import type { Metadata } from "next";
import Link from "next/link";
import { getPointScaleRows, listSeasons } from "@/lib/db/seasons";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { formatDateShort } from "@/lib/format";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import SeasonForm from "@/components/admin/SeasonForm";
import PointScaleEditor from "@/components/admin/PointScaleEditor";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Saisons · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const TONE: Record<string, BadgeTone> = { draft: "neutral", active: "good", closed: "gold" };
const LABEL: Record<string, string> = { draft: "Brouillon", active: "Active", closed: "Terminée" };

type Props = { searchParams: Promise<{ saison?: string; nouvelle?: string }> };

export default async function AdminSaisonsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const seasons = await listSeasons();
  const admin = createAdminSupabase();
  const { data: counts } = await admin.from("events").select("season_id, status").returns<Array<{ season_id: string | null; status: string }>>();
  const eventsBySeason = new Map<string, { total: number; completed: number }>();
  for (const e of counts ?? []) {
    if (!e.season_id) continue;
    const c = eventsBySeason.get(e.season_id) ?? { total: 0, completed: 0 };
    c.total += 1;
    if (e.status === "completed") c.completed += 1;
    eventsBySeason.set(e.season_id, c);
  }

  const creating = sp.nouvelle !== undefined;
  const selected = !creating ? (seasons.find((s) => s.id === sp.saison) ?? seasons.find((s) => s.status === "active") ?? seasons[0] ?? null) : null;
  const rules = selected ? await getPointScaleRows(selected.id) : [];

  return (
    <div className="space-y-6">
      <SectionHeading
        as="h1"
        size="lg"
        title="Saisons et barème"
        action={
          <Button href="/admin/saisons?nouvelle" size="sm">
            + Nouvelle saison
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card padding="none" className="overflow-hidden self-start">
          <p className="border-b hairline px-4 py-3 text-sm font-semibold text-cream-100">Saisons</p>
          {seasons.length === 0 ? (
            <p className="px-4 py-4 text-sm text-cream-400">Aucune saison. Créez-en une pour démarrer le classement.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {seasons.map((s) => {
                const c = eventsBySeason.get(s.id);
                return (
                  <li key={s.id}>
                    <Link
                      href={`/admin/saisons?saison=${s.id}`}
                      className={cn("block px-4 py-3 hover:bg-cream-100/5", selected?.id === s.id && "bg-gold-400/10")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-cream-100">{s.name}</span>
                        <Badge tone={TONE[s.status]}>{LABEL[s.status]}</Badge>
                      </div>
                      <p className="text-xs text-cream-600 mt-0.5">
                        {formatDateShort(s.starts_on)}
                        {s.ends_on ? ` → ${formatDateShort(s.ends_on)}` : ""}
                        {c ? ` · ${c.completed}/${c.total} tournois publiés` : " · aucun tournoi"}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          {creating ? (
            <SeasonForm season={null} />
          ) : selected ? (
            <>
              <SeasonForm key={selected.id} season={selected} />
              <PointScaleEditor key={`scale-${selected.id}-${rules.length}`} seasonId={selected.id} rules={rules} />
            </>
          ) : (
            <SeasonForm season={null} />
          )}
        </div>
      </div>
    </div>
  );
}
