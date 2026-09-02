import Link from "next/link";

type Props = {
  current: "one-piece" | "riftbound";
  basePath: string;
};

/** Sélecteur One Piece / Riftbound des pages classement & résultats. */
export default function GameTabs({ current, basePath }: Props) {
  const base =
    "px-5 py-2 text-sm font-semibold transition-colors whitespace-nowrap";
  return (
    <div className="inline-flex rounded-full border hairline overflow-hidden mb-8 bg-coal-800">
      <Link
        href={basePath}
        className={`${base} ${
          current === "one-piece"
            ? "bg-gold-400 text-coal-950"
            : "text-cream-400 hover:text-cream-100"
        }`}
      >
        One Piece
      </Link>
      <Link
        href={`${basePath}?jeu=riftbound`}
        className={`${base} ${
          current === "riftbound"
            ? "bg-rift-600 text-white"
            : "text-cream-400 hover:text-cream-100"
        }`}
      >
        Riftbound
      </Link>
    </div>
  );
}
