/* Bandeau photo défilant en continu (pause au survol). */

const PHOTOS = Array.from({ length: 16 }, (_, i) => `/ambiance/amb-${String(i + 1).padStart(2, "0")}.jpg`);

function Strip({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 gap-3 pr-3" aria-hidden={hidden}>
      {PHOTOS.map((src) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={src}
          src={src}
          alt={hidden ? "" : "Tournoi Mister 8 à Courbevoie"}
          loading="lazy"
          className="h-52 sm:h-64 w-auto rounded-xl border hairline object-cover"
        />
      ))}
    </div>
  );
}

export default function AmbianceCarousel() {
  return (
    <section className="py-10 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-bold text-cream-100">
          L&apos;ambiance de nos tournois
        </h2>
        <p className="text-sm text-cream-600 hidden sm:block">
          Chaque mois à Courbevoie
        </p>
      </div>
      <div className="marquee group">
        <div className="marquee-track flex w-max group-hover:[animation-play-state:paused]">
          <Strip />
          <Strip hidden />
        </div>
      </div>
    </section>
  );
}
