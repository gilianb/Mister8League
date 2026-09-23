/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { listLeaders } from "@/lib/db/leaders";
import type { LeaderRow } from "@/lib/db/types";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/format";
import { LEADER_COLOR_HEX, isStoredLeaderImage } from "@/lib/leaders/storage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import LeaderSyncPanel from "@/components/admin/LeaderSyncPanel";
import LeaderEditForm from "@/components/admin/LeaderEditForm";

export const metadata: Metadata = { title: "Leaders · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";
// La synchronisation (Server Action de cette page) copie jusqu'à ~140 visuels.
export const maxDuration = 300;

/** « OP17-001 » → « OP17 » ; extensions les plus récentes en premier. */
function groupBySet(leaders: LeaderRow[]) {
  const groups = new Map<string, LeaderRow[]>();
  for (const l of leaders) {
    const set = l.code?.split("-")[0] ?? "Sans code";
    groups.set(set, [...(groups.get(set) ?? []), l]);
  }
  const kindOrder = (s: string) => (s.startsWith("OP") ? 0 : s.startsWith("EB") ? 1 : s.startsWith("PRB") ? 2 : s.startsWith("ST") ? 3 : 4);
  return [...groups.entries()].sort(([a], [b]) => kindOrder(a) - kindOrder(b) || b.localeCompare(a, "fr", { numeric: true }));
}

export default async function AdminLeadersPage() {
  const admin = createAdminSupabase();
  const [leaders, { data: lastSync }] = await Promise.all([
    listLeaders(),
    admin
      .from("admin_events")
      .select("created_at")
      .eq("action", "leaders_sync")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string }>(),
  ]);
  const pendingImages = leaders.filter((l) => !isStoredLeaderImage(l.image_url)).length;

  return (
    <div className="space-y-8">
      <SectionHeading as="h1" size="lg" title="Leaders" eyebrow={`${leaders.length} leaders One Piece`} />

      <LeaderSyncPanel lastSyncLabel={lastSync ? formatDateTime(lastSync.created_at) : null} pendingImages={pendingImages} />

      {groupBySet(leaders).map(([set, list]) => (
        <section key={set} className="space-y-3">
          <h2 className="kicker">{set}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {list.map((l) => (
              <li key={l.id} className="rounded-panel border hairline bg-coal-900 p-2.5">
                <div className="flex gap-2.5">
                  {l.image_url ? (
                    <img
                      src={l.image_url}
                      alt=""
                      loading="lazy"
                      className="h-20 w-14 shrink-0 rounded-control border border-black/30 object-cover"
                      style={{ objectPosition: "50% 18%" }}
                    />
                  ) : (
                    <span className="h-20 w-14 shrink-0 rounded-control border border-dashed border-cream-600/40 bg-coal-950" />
                  )}
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono text-[11px] text-cream-500">{l.code}</p>
                    <p className="text-sm font-semibold leading-tight text-cream-100">{l.name}</p>
                    <p className="flex flex-wrap items-center gap-1 text-[11px] text-cream-500">
                      {l.colors.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1">
                          <span className="inline-block size-2 rounded-full border border-black/30" style={{ background: LEADER_COLOR_HEX[c] ?? "#888" }} />
                          {c}
                        </span>
                      ))}
                    </p>
                    {!isStoredLeaderImage(l.image_url) && <Badge tone="warn">{l.image_url ? "Visuel local" : "Sans visuel"}</Badge>}
                  </div>
                </div>
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-xs text-gold-400 hover:underline">Corriger</summary>
                  <LeaderEditForm id={l.id} name={l.name} colors={l.colors} />
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
