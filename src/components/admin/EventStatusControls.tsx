"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEventAction, setEventStatusAction } from "@/lib/admin/events";
import type { EventStatus } from "@/lib/db/types";
import { Button } from "@/components/ui/Button";

export default function EventStatusControls({ eventId, status }: { eventId: string; status: EventStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: EventStatus) {
    setError(null);
    start(async () => {
      const res = await setEventStatusAction(eventId, next);
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Supprimer définitivement ce tournoi ? (impossible s'il a des résultats ou des inscrits payés)")) return;
    setError(null);
    start(async () => {
      const res = await deleteEventAction(eventId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <Button size="sm" onClick={() => change("published")} pending={pending}>
            Publier
          </Button>
        )}
        {status === "published" && (
          <Button size="sm" variant="ghost" onClick={() => change("draft")} pending={pending}>
            Repasser en brouillon
          </Button>
        )}
        {(status === "draft" || status === "published") && (
          <Button size="sm" variant="danger" onClick={() => change("cancelled")} pending={pending}>
            Annuler le tournoi
          </Button>
        )}
        {status === "cancelled" && (
          <Button size="sm" variant="outline" onClick={() => change("draft")} pending={pending}>
            Rétablir en brouillon
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={remove} pending={pending} className="text-red-300">
          Supprimer
        </Button>
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
