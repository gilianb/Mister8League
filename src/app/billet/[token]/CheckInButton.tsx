"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkInByTokenAction, type TicketStatus } from "@/lib/tournaments/checkin";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { IconCheck } from "@/components/ui/icons";

export default function CheckInButton({ token, initialStatus }: { token: string; initialStatus: TicketStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const disabled = initialStatus !== "valid";

  function confirm() {
    start(async () => {
      const res = await checkInByTokenAction(token);
      setFeedback(res.error ? { tone: "error", text: res.error } : { tone: "success", text: res.message ?? "Présence confirmée." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}
      <Button onClick={confirm} pending={pending} disabled={disabled} className="w-full" size="lg">
        <IconCheck size={18} />
        {initialStatus === "already_checked_in" ? "Déjà enregistré" : initialStatus === "not_paid" ? "Paiement requis" : "Confirmer la présence"}
      </Button>
    </div>
  );
}
