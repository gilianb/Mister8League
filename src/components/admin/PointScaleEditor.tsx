"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { savePointScaleAction } from "@/lib/admin/seasons";
import type { ActionState } from "@/lib/auth/actions";
import type { PointScaleRuleRow } from "@/lib/db/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";
import { IconPlus, IconTrash } from "@/components/ui/icons";

type Line = { key: number; label: string; min: string; max: string; points: string };

export default function PointScaleEditor({ seasonId, rules }: { seasonId: string; rules: PointScaleRuleRow[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(() =>
    rules.map((r, i) => ({ key: i, label: r.label, min: String(r.placement_min), max: r.placement_max == null ? "" : String(r.placement_max), points: String(r.points) }))
  );
  const [state, action] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const res = await savePointScaleAction(prev, fd);
      if (res.ok) router.refresh();
      return res;
    },
    {} as ActionState
  );

  const update = (key: number, field: keyof Omit<Line, "key">, value: string) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, [field]: value } : l)));

  return (
    <Card>
      <form action={action} className="space-y-4">
        <input type="hidden" name="season_id" value={seasonId} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-cream-100">Barème des points</h2>
            <p className="text-xs text-cream-600 mt-1">Tranches de placement → points. La tranche la plus étroite l&apos;emporte. Max vide = jusqu&apos;au dernier. Les points des tournois déjà publiés sont recalculés.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((ls) => [...ls, { key: Date.now(), label: "", min: "", max: "", points: "" }])}
          >
            <IconPlus size={14} /> Tranche
          </Button>
        </div>
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.ok && <Alert tone="success">{state.message}</Alert>}
        <div className="grid grid-cols-[1fr_80px_80px_80px_36px] gap-2 text-[10px] tracking-[0.16em] text-cream-600 font-semibold px-1">
          <span>LIBELLÉ</span>
          <span>MIN</span>
          <span>MAX</span>
          <span>POINTS</span>
          <span />
        </div>
        {lines.map((l) => (
          <div key={l.key} className="grid grid-cols-[1fr_80px_80px_80px_36px] gap-2 items-center">
            <Input name="rule_label" value={l.label} onChange={(e) => update(l.key, "label", e.target.value)} placeholder="Top 8" />
            <Input name="rule_min" type="number" min={1} value={l.min} onChange={(e) => update(l.key, "min", e.target.value)} />
            <Input name="rule_max" type="number" min={1} value={l.max} onChange={(e) => update(l.key, "max", e.target.value)} placeholder="∞" />
            <Input name="rule_points" type="number" min={0} value={l.points} onChange={(e) => update(l.key, "points", e.target.value)} />
            <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="p-2 text-cream-500 hover:text-red-300" aria-label="Supprimer la tranche">
              <IconTrash size={16} />
            </button>
          </div>
        ))}
        <div className="flex justify-end">
          <SubmitButton pendingText="Enregistrement…">Enregistrer le barème</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
