/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/cn";

export function Avatar({
  src,
  name,
  size = 40,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full border border-black/30 bg-coal-700 object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gold-400 font-display font-semibold leading-none text-coal-950",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44) }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
