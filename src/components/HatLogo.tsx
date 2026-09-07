import Image from "next/image";
import { cn } from "@/lib/cn";

/** Le chapeau de paille de Mister 8, emblème du site (recadré depuis le logo officiel). */
export default function HatLogo({ className = "w-8", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/chapeau-emblem.png"
      alt=""
      width={480}
      height={252}
      priority={priority}
      className={cn("h-auto shrink-0 select-none", className)}
      aria-hidden="true"
    />
  );
}
