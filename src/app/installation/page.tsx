import type { Metadata } from "next";
import { missingEnv } from "@/lib/env";
import HatLogo from "@/components/HatLogo";

export const metadata: Metadata = { title: "Configuration requise", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function InstallationPage() {
  const missing = missingEnv();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <HatLogo className="w-14 mb-6" />
      <h1 className="font-display text-3xl font-bold text-cream-100 mb-3">Configuration requise</h1>
      <p className="text-cream-400 mb-8">
        Le site a besoin d&apos;un projet Supabase pour fonctionner. Copiez <code className="text-gold-300">.env.example</code>{" "}
        en <code className="text-gold-300">.env.local</code>, renseignez les valeurs puis relancez le serveur. La marche à
        suivre complète est dans le README.
      </p>
      <div className="rounded-2xl border hairline bg-coal-800 p-6">
        <p className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-3">VARIABLES MANQUANTES</p>
        {missing.length === 0 ? (
          <p className="text-sm text-emerald-300">Toutes les variables sont renseignées. Redémarrez le serveur.</p>
        ) : (
          <ul className="space-y-1.5 font-mono text-sm text-cream-100">
            {missing.map((n) => (
              <li key={n} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {n}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
