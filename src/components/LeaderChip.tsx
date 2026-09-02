import Image from "next/image";
import { getLeader } from "@/lib/data/leaders";

type Props = {
  code?: string;
  /** Nom affiché (sinon celui du catalogue) */
  name?: string;
  size?: number;
  hideName?: boolean;
};

/** Vignette de carte leader + nom, utilisée dans les tableaux et légendes. */
export default function LeaderChip({ code, name, size = 28, hideName = false }: Props) {
  const leader = getLeader(code);
  const label = name ?? leader?.name;

  return (
    <span className="inline-flex items-center gap-2 min-w-0 align-middle">
      {leader && (
        <Image
          src={leader.image}
          alt={label ?? ""}
          width={size}
          height={size}
          className="rounded-md object-cover shrink-0 border border-black/20"
          style={{ width: size, height: size, objectPosition: "50% 18%" }}
        />
      )}
      {!hideName && <span className="truncate">{label ?? "—"}</span>}
    </span>
  );
}
