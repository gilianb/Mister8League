"use client";

import { useActionState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeAvatarAction, uploadAvatarAction } from "@/lib/profiles/actions";
import type { ActionState } from "@/lib/auth/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { IconUpload } from "@/components/ui/icons";

export default function AvatarForm({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  const router = useRouter();
  const [state, action] = useActionState(
    async (prev: ActionState, fd: FormData) => {
      const res = await uploadAvatarAction(prev, fd);
      if (res.ok) router.refresh();
      return res;
    },
    {} as ActionState
  );
  const [removing, startRemove] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card className="flex flex-wrap items-center gap-5">
      <Avatar src={avatarUrl} name={name} size={72} />
      <form action={action} className="flex-1 min-w-56 space-y-2">
        <p className="text-[11px] tracking-[0.16em] font-semibold text-cream-400">PHOTO DE PROFIL</p>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="text-xs text-cream-400 file:mr-3 file:rounded-md file:border-0 file:bg-coal-700 file:px-3 file:py-1.5 file:text-cream-100 file:text-xs" />
          <SubmitButton variant="outline" size="sm" pendingText="Envoi…">
            <IconUpload size={14} /> Envoyer
          </SubmitButton>
          {avatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              pending={removing}
              onClick={() =>
                startRemove(async () => {
                  await removeAvatarAction();
                  router.refresh();
                })
              }
            >
              Retirer
            </Button>
          )}
        </div>
        <p className="text-xs text-cream-600">JPG, PNG ou WebP, 2 Mo maximum.</p>
        {state.error && <p className="text-xs text-red-300">{state.error}</p>}
        {state.ok && <p className="text-xs text-emerald-300">{state.message}</p>}
      </form>
    </Card>
  );
}
