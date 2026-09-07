import { requireUser } from "@/lib/auth/session";
import Image from "next/image";
import Link from "next/link";
import JoueurNav from "./JoueurNav";

export const dynamic = "force-dynamic";

export default async function JoueurLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/joueur");
  return (
    <div className="page-shell py-8 sm:py-12 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <aside>
          <div className="lg:sticky lg:top-24">
            <p className="mb-4 hidden text-sm font-semibold text-cream-100 lg:block">Mon espace</p>
            <JoueurNav />
            <Link href="/calendrier" className="group relative mt-10 hidden aspect-[4/5] overflow-hidden rounded-panel lg:block">
              <Image src="/ambiance/amb-06.jpg" alt="" fill sizes="220px" className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
              <div className="absolute inset-0 bg-linear-to-t from-coal-950 via-coal-950/30 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-display text-2xl font-medium leading-tight tracking-tight text-cream-100">On se retrouve à la table.</p>
                <span className="mt-3 block text-[13px] font-semibold text-gold-400">Les prochains tournois</span>
              </div>
            </Link>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
