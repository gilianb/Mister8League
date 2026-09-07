"use client";

import { useEffect, useState, useTransition } from "react";
import { resendConfirmationAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { IconRefresh } from "@/components/ui/icons";

const COOLDOWN_KEY = "m8t_resend_next";

export default function ResendConfirmation({ initialEmail, next }: { initialEmail: string; next?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [cooldown, setCooldown] = useState(0);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const tick = () => {
      let nextAllowed = 0;
      try {
        nextAllowed = Number(localStorage.getItem(COOLDOWN_KEY) || "0");
      } catch {}
      setCooldown(Math.max(0, Math.ceil((nextAllowed - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  function resend() {
    if (!email.includes("@") || cooldown > 0) return;
    try {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() + 60_000));
    } catch {}
    setFeedback(null);
    startTransition(async () => {
      const res = await resendConfirmationAction(email, next);
      setFeedback(res.error ? { tone: "error", text: res.error } : { tone: "success", text: res.message ?? "Envoyé." });
    });
  }

  return (
    <div className="space-y-3">
      <label htmlFor="resend-email" className="block text-[13px] font-medium text-cream-300">Votre adresse e-mail</label>
      <Input id="resend-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.fr" autoComplete="email" />
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}
      <Button variant="outline" className="w-full" onClick={resend} disabled={!email.includes("@") || cooldown > 0} pending={pending}>
        <IconRefresh size={16} />
        {cooldown > 0 ? `Renvoyer dans ${cooldown} s` : "Renvoyer l'e-mail de confirmation"}
      </Button>
    </div>
  );
}
