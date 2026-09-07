import type { Metadata } from "next";
import { getSessionWithProfile } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/paths";
import { Alert } from "@/components/ui/Alert";
import { PageHeader } from "@/components/ui/PageHeader";
import ProfileForm from "./ProfileForm";
import AvatarForm from "./AvatarForm";

export const metadata: Metadata = { title: "Mon profil", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; raison?: string }> };

export default async function ProfilPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { user, profile } = await getSessionWithProfile();
  if (!user) return null;
  const next = sp.next ? safeNextPath(sp.next, "") : "";

  return (
    <div className="space-y-8">
      <PageHeader
        size="md"
        className="mb-0"
        title="Mon profil"
        lede="Votre pseudo est public. Votre e-mail, votre téléphone et votre numéro Bandai ne le sont jamais."
      />
      {sp.raison === "inscription" && (
        <Alert tone="info" title="Une dernière étape avant l'inscription">
          Complétez pseudo, nom complet et numéro de membre Bandai : ils sont nécessaires pour votre billet et pour
          rattacher vos résultats.
        </Alert>
      )}
      <AvatarForm avatarUrl={profile?.avatar_url ?? null} name={profile?.pseudo ?? user.email ?? "?"} />
      <ProfileForm
        initial={{
          pseudo: profile?.pseudo ?? "",
          full_name: profile?.full_name ?? "",
          bandai_member_id: profile?.bandai_member_id ?? "",
          phone: profile?.phone ?? "",
          bio: profile?.bio ?? "",
          is_public: profile?.is_public ?? true,
        }}
        email={user.email ?? ""}
        next={next}
      />
    </div>
  );
}
