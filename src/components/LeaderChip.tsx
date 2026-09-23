/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/cn";

type Props = {
  /** Nom du leader (table `leaders`) */
  name?: string | null;
  /** Visuel (table `leaders`, Supabase Storage) */
  imageUrl?: string | null;
  size?: number;
  hideName?: boolean;
  className?: string;
};

/** Vignette de carte leader + nom, utilisée dans les tableaux et légendes. */
export default function LeaderChip({ name, imageUrl, size = 28, hideName = false, className }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2 min-w-0 align-middle", className)}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name ?? ""}
          width={size}
          height={size}
          loading="lazy"
          className="rounded-md object-cover shrink-0 border border-black/20"
          style={{ width: size, height: size, objectPosition: "50% 18%" }}
        />
      ) : (
        <span
          className="rounded-md shrink-0 border border-dashed border-cream-600/40 bg-coal-900"
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
      )}
      {!hideName && <span className="truncate">{name ?? "—"}</span>}
    </span>
  );
}
