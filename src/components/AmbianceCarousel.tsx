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
          className="h-56 w-auto rounded-panel object-cover sm:h-72"
        />
      ))}
    </div>
  );
}

export default function AmbianceCarousel() {
  return (
    <section className="overflow-hidden py-16 sm:py-20">
      <div className="page-shell mb-7 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-medium tracking-[-0.015em] text-cream-100 sm:text-[1.75rem]">Nos tournois, en vrai</h2>
        <p className="text-sm text-cream-500">Chaque mois à Courbevoie</p>
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
