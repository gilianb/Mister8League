/* eslint-disable @next/next/no-img-element */
import { getLeader } from "@/lib/data/leaders";
import { cn } from "@/lib/cn";

type Props = {
  code?: string | null;
  /** Nom affiché (sinon celui du catalogue) */
  name?: string | null;
  /** Visuel (sinon celui du catalogue statique, via le code) */
  imageUrl?: string | null;
  size?: number;
  hideName?: boolean;
  className?: string;
};

/** Vignette de carte leader + nom, utilisée dans les tableaux et légendes. */
export default function LeaderChip({ code, name, imageUrl, size = 28, hideName = false, className }: Props) {
  const catalog = code ? getLeader(code) : undefined;
  const src = imageUrl ?? catalog?.image ?? null;
  const label = name ?? catalog?.name ?? null;

  return (
    <span className={cn("inline-flex items-center gap-2 min-w-0 align-middle", className)}>
      {src ? (
        <img
          src={src}
          alt={label ?? ""}
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
      {!hideName && <span className="truncate">{label ?? "—"}</span>}
    </span>
  );
}
