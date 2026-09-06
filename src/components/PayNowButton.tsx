"use client";

import { useActionState } from "react";
import { cancelPendingRegistrationAction, resumeCheckoutAction } from "@/lib/tournaments/actions";
import type { ActionState } from "@/lib/auth/actions";
import { Button } from "./ui/Button";
import { IconCreditCard } from "./ui/icons";

/** Reprise d'un paiement Mollie en attente + annulation de la réservation. */
export default function PayNowButton({ registrationId, showCancel = true, size = "md" }: { registrationId: string; showCancel?: boolean; size?: "sm" | "md" | "lg" }) {
  const [payState, pay, payPending] = useActionState(async (): Promise<ActionState> => resumeCheckoutAction(registrationId), {});
  const [cancelState, cancel, cancelPending] = useActionState(async (): Promise<ActionState> => cancelPendingRegistrationAction(registrationId), {});

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <form action={pay}>
          <Button type="submit" variant="brand" size={size} pending={payPending}>
            <IconCreditCard size={16} /> Payer maintenant
          </Button>
        </form>
        {showCancel && (
          <form action={cancel}>
            <Button type="submit" variant="ghost" size={size} pending={cancelPending}>
              Annuler ma réservation
            </Button>
          </form>
        )}
      </div>
      {(payState.error || cancelState.error) && <p className="text-xs text-red-300">{payState.error ?? cancelState.error}</p>}
    </div>
  );
}
