"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unpublishResultsAction } from "@/lib/admin/results";
import { Button } from "@/components/ui/Button";

export default function UnpublishResultsButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="danger"
        size="sm"
        pending={pending}
        onClick={() => {
          if (!window.confirm("Retirer les résultats publiés ? Les points de ligue de ce tournoi seront supprimés du classement jusqu'à un nouvel import.")) return;
          start(async () => {
            const res = await unpublishResultsAction(eventId);
            if (res.error) setError(res.error);
            router.refresh();
          });
        }}
      >
        Retirer les résultats
      </Button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
