import type { MetagameSlice } from "@/lib/db/results";
import LeaderChip from "./LeaderChip";

// Ordre fixe, luminosités alternées pour rester lisible en cas de
// daltonisme ; « Autres leaders » prend toujours le gris final.
const PALETTE = ["#F6C36B", "#5B8DD9", "#EDE3CC", "#C9331F", "#8FD0C9", "#9B7FD4", "#7CA65C", "#E08E5B"];
const OTHER_COLOR = "#8E8672";

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

/** Camembert des leaders joués, avec vignette du leader sur les parts assez larges. */
export default function MetagameDonut({ slices, title = "JOUEURS" }: { slices: MetagameSlice[]; title?: string }) {
  const total = slices.reduce((s, x) => s + x.count, 0);
  if (total === 0) return null;

  const cx = 110;
  const cy = 110;
  const r = 78;
  const stroke = 34;
  const gap = 0.03;
  const thumb = 26;

  const segments: Array<MetagameSlice & { color: string; share: number; d: string; thumbX: number; thumbY: number; showThumb: boolean }> = [];
  let angle = -Math.PI / 2;
  for (let i = 0; i < slices.length; i++) {
    const s = slices[i];
    const isOther = s.leaderId === null;
    const color = isOther ? OTHER_COLOR : PALETTE[i % PALETTE.length];
    const span = (s.count / total) * Math.PI * 2;
    const a0 = angle + gap / 2;
    const a1 = angle + span - gap / 2;
    const mid = angle + span / 2;
    angle += span;
    const share = s.count / total;
    segments.push({
      ...s,
      color,
      share,
      d: arcPath(cx, cy, r, a0, Math.max(a1, a0 + 0.01)),
      thumbX: cx + r * Math.cos(mid) - thumb / 2,
      thumbY: cy + r * Math.sin(mid) - thumb / 2,
      showThumb: !isOther && !!s.imageUrl && share >= 0.08,
    });
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 220 220" className="w-56 shrink-0" role="img" aria-label={`Répartition des leaders sur ${total} joueurs`}>
        <defs>
          {segments.map((s, i) =>
            s.showThumb ? (
              <clipPath key={i} id={`mg-clip-${i}`}>
                <circle cx={s.thumbX + thumb / 2} cy={s.thumbY + thumb / 2} r={thumb / 2} />
              </clipPath>
            ) : null
          )}
        </defs>
        {segments.map((s, i) => (
          <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth={stroke} />
        ))}
        {segments.map((s, i) =>
          s.showThumb ? (
            <g key={`t-${i}`}>
              <circle cx={s.thumbX + thumb / 2} cy={s.thumbY + thumb / 2} r={thumb / 2 + 1.5} fill="#221f1c" />
              <image
                href={s.imageUrl!}
                x={s.thumbX}
                y={s.thumbY - thumb * 0.15}
                width={thumb}
                height={thumb * 1.4}
                preserveAspectRatio="xMidYMin slice"
                clipPath={`url(#mg-clip-${i})`}
              />
            </g>
          ) : null
        )}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-cream-100" fontSize="28" fontWeight="700">
          {total}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="fill-cream-600" fontSize="9" letterSpacing="2">
          {title}
        </text>
      </svg>

      <ul className="w-full space-y-1.5 text-sm">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5">
            <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} aria-hidden="true" />
            <span className="text-cream-100 font-medium truncate flex-1 min-w-0">
              <LeaderChip code={s.leaderCode} name={s.leaderName} imageUrl={s.imageUrl} size={30} />
            </span>
            <span className="text-xs text-cream-600 hidden sm:inline shrink-0">meilleur : {s.bestPlacement === 1 ? "1er" : `${s.bestPlacement}e`}</span>
            <span className="text-cream-400 tabular shrink-0">
              {s.count} · {Math.round(s.share * 100)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
