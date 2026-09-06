import { NextResponse } from "next/server";
import { getSessionWithProfile } from "@/lib/auth/session";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { fulfilRegistration } from "@/lib/payments/fulfil";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { id: string; profile_id: string | null; status: string; ticket_pdf_path: string | null };

/** Télécharge le billet PDF (propriétaire ou admin) via une URL signée 10 min. */
export async function GET(_req: Request, ctx: { params: Promise<{ registrationId: string }> }) {
  const { registrationId } = await ctx.params;
  const { user, profile } = await getSessionWithProfile();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const admin = createAdminSupabase();
  const { data: reg } = await admin
    .from("registrations")
    .select("id, profile_id, status, ticket_pdf_path")
    .eq("id", registrationId)
    .maybeSingle<Row>();
  if (!reg) return NextResponse.json({ error: "Inscription introuvable." }, { status: 404 });

  const isOwner = reg.profile_id === user.id;
  const isAdmin = profile?.role === "admin";
  if (!isOwner && !isAdmin) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  if (reg.status !== "paid" && reg.status !== "checked_in") {
    return NextResponse.json({ error: "Billet disponible après paiement." }, { status: 409 });
  }

  let path = reg.ticket_pdf_path;
  if (!path) {
    const result = await fulfilRegistration(reg.id);
    path = result.ticketPath;
  }
  if (!path) return NextResponse.json({ error: "Billet non disponible pour le moment." }, { status: 503 });

  const { data, error } = await admin.storage.from("tournament-tickets").createSignedUrl(path, 60 * 10, {
    download: `Mister8_Billet.pdf`,
  });
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Impossible de générer le lien." }, { status: 500 });
  return NextResponse.redirect(data.signedUrl, { status: 302 });
}
