import Image from "next/image";
import Link from "next/link";
import HatLogo from "@/components/HatLogo";

/** Gabarit des pages d'authentification : photo du club à gauche, formulaire à droite. */
export default function AuthFrame({ title, description, children }: { title: string; description: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="page-shell py-8 sm:py-14">
      <div className="grid overflow-hidden rounded-panel border hairline bg-coal-800 lg:min-h-[680px] lg:grid-cols-[1fr_1.05fr]">
        <aside className="relative isolate flex min-h-52 flex-col justify-end p-7 sm:min-h-64 sm:p-10 lg:p-12">
          <Image
            src="/ambiance/amb-04.jpg"
            alt="Une partie de One Piece Card Game chez Mister 8"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="-z-20 object-cover object-[50%_40%]"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-coal-950 via-coal-950/40 to-coal-950/10" aria-hidden="true" />
          <p className="max-w-[14ch] font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-cream-100 sm:text-4xl lg:text-5xl">
            Votre place est à la table.
          </p>
          <p className="mt-3 hidden max-w-[36ch] text-sm leading-relaxed text-cream-300 lg:block">
            Un compte, vos inscriptions, vos decks et votre saison au même endroit.
          </p>
        </aside>

        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 sm:py-14">
          <div className="mx-auto w-full max-w-md">
            <HatLogo className="mb-6 w-12" />
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-cream-100 sm:text-4xl">{title}</h1>
            <div className="mt-3 text-[15px] leading-relaxed text-cream-400">{description}</div>
            <div className="mt-8">{children}</div>
            <p className="mt-8 border-t hairline pt-5 text-sm text-cream-500">
              Envie de voir les dates avant de vous lancer ?{" "}
              <Link href="/calendrier" className="text-link">
                Les prochains tournois
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
