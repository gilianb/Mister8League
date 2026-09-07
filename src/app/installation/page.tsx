import type { Metadata } from "next";
import { missingEnv } from "@/lib/env";
import HatLogo from "@/components/HatLogo";

export const metadata: Metadata = { title: "Configuration requise", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function InstallationPage() {
  const missing = missingEnv();
  return (
    <div className="page-shell max-w-2xl py-16 sm:py-24">
      <HatLogo className="mb-6 w-16" />
      <p className="kicker">Mise en service</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.025em] text-cream-100 sm:text-5xl">Configuration requise.</h1>
      <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-cream-400">
        Le site a besoin d&apos;un projet Supabase pour fonctionner. Copiez <code className="rounded-control bg-coal-800 px-1.5 py-0.5 text-[13px] text-gold-300">.env.example</code>{" "}
        en <code className="rounded-control bg-coal-800 px-1.5 py-0.5 text-[13px] text-gold-300">.env.local</code>, renseignez les valeurs puis relancez le serveur. La
        marche à suivre complète est dans le README.
      </p>
      <div className="surface-panel mt-10 p-6">
        <h2 className="text-sm font-semibold text-cream-100">Variables manquantes</h2>
        {missing.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-300">Toutes les variables sont renseignées. Redémarrez le serveur.</p>
        ) : (
          <ul className="mt-3 space-y-2 font-mono text-sm text-cream-100">
            {missing.map((n) => (
              <li key={n} className="flex items-center gap-2.5">
                <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
                {n}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
