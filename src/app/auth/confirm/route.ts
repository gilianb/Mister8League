import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeNextPath } from "@/lib/auth/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EmailOtpType = "signup" | "magiclink" | "recovery" | "invite" | "email_change" | "email";

/**
 * Lien de confirmation « token_hash » (template Supabase recommandé, voir README) :
 * vérifie le jeton, pose les cookies de session et redirige.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const defaultNext = type === "recovery" ? "/connexion/nouveau-mot-de-passe" : "/joueur";
  const next = safeNextPath(url.searchParams.get("next") ?? url.searchParams.get("redirect_to"), defaultNext);

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(`/auth/erreur?msg=${encodeURIComponent("Lien incomplet.")}`, url.origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.redirect(new URL("/installation", url.origin));
  }

  // La réponse est créée d'abord pour que Supabase y attache les cookies.
  const response = NextResponse.redirect(new URL(next, url.origin));
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    return NextResponse.redirect(new URL(`/auth/erreur?msg=${encodeURIComponent(error.message)}`, url.origin));
  }
  return response;
}
