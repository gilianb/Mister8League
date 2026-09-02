import type { MetagameSlice } from "@/lib/types";
import LeaderChip from "./LeaderChip";

// Ordre fixe, luminosités alternées pour rester lisible en cas de
// daltonisme ; « Autres leaders » prend toujours le gris final.
const PALETTE = [
  "#F6C36B", // or clair
  "#5B8DD9", // bleu moyen
  "#EDE3CC", // crème très clair
  "#C9331F", // rouge sombre
  "#8FD0C9", // turquoise clair
  "#9B7FD4", // violet moyen
  "#7CA65C", // vert moyen
];
const OTHER_COLOR = "#8E8672";

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export default function MetagameDonut({ slices }: { slices: MetagameSlice[] }) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  if (total === 0) return null;

  const cx = 90;
  const cy = 90;
  const r = 68;
  const stroke = 26;
  const gap = 0.035; // ≈ 2px d'écart entre segments

  let angle = -Math.PI / 2;
  const segments = slices.map((s, i) => {
    const isOther = s.leaderName.toLowerCase().startsWith("autre");
    const color = isOther ? OTHER_COLOR : PALETTE[i % PALETTE.length];
    const span = (s.count / total) * Math.PI * 2;
    const a0 = angle + gap / 2;
    const a1 = angle + span - gap / 2;
    angle += span;
    return { ...s, color, d: arcPath(cx, cy, r, a0, Math.max(a1, a0 + 0.01)) };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg
        viewBox="0 0 180 180"
        className="w-44 shrink-0"
        role="img"
        aria-label={`Répartition des leaders sur ${total} joueurs`}
      >
        {segments.map((s) => (
          <path
            key={s.leaderName}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
          />
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-cream-100"
          fontSize="26"
          fontWeight="700"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          className="fill-cream-600"
          fontSize="9"
          letterSpacing="2"
        >
          JOUEURS
        </text>
      </svg>

      <ul className="w-full space-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.leaderName} className="flex items-center gap-2.5">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            <span className="text-cream-100 font-medium truncate">
              <LeaderChip code={s.leaderCode} name={s.leaderName} size={30} />
            </span>
            <span className="ml-auto text-cream-400 tabular shrink-0">
              {s.count} · {Math.round((s.count / total) * 100)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
