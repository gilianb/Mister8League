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
    <Card padding="lg" className="flex flex-wrap items-center gap-6">
      <Avatar src={avatarUrl} name={name} size={88} />
      <form action={action} className="min-w-0 flex-1 space-y-3">
        <label htmlFor="profile-avatar" className="block font-display text-xl font-medium tracking-tight text-cream-100">Photo de profil</label>
        <div className="flex flex-wrap items-center gap-2">
          <input id="profile-avatar" ref={fileRef} type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="max-w-full text-[13px] text-cream-400 file:mr-3 file:rounded-control file:border-0 file:bg-coal-700 file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-cream-100" />
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
        <p className="text-[13px] text-cream-500">JPG, PNG ou WebP, 2 Mo maximum.</p>
        {state.error && <p className="text-[13px] text-red-300">{state.error}</p>}
        {state.ok && <p className="text-[13px] text-emerald-300">{state.message}</p>}
      </form>
    </Card>
  );
}
