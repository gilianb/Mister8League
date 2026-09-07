import type { SeasonRow } from "@/lib/db/types";
import { Tabs } from "./ui/Tabs";

/** Sélecteur de saison (liens `?saison=slug`). */
export default function SeasonTabs({
  seasons,
  currentSlug,
  basePath,
}: {
  seasons: SeasonRow[];
  currentSlug: string | null;
  basePath: string;
}) {
  if (seasons.length <= 1) return null;
  return (
    <Tabs
      className="mb-8"
      items={seasons.map((s) => ({
        href: `${basePath}?saison=${encodeURIComponent(s.slug)}`,
        label: s.name,
        active: s.slug === currentSlug,
      }))}
    />
  );
}
