// Constantes partagées (serveur et client) pour les leaders.

export const LEADER_IMAGE_BUCKET = "leader-images";

export const LEADER_COLORS = ["Rouge", "Vert", "Bleu", "Violet", "Noir", "Jaune"] as const;

/** Pastilles de couleur des cartes. */
export const LEADER_COLOR_HEX: Record<string, string> = {
  Rouge: "#d63a2a",
  Vert: "#3f9a55",
  Bleu: "#3a74c4",
  Violet: "#7d4fb0",
  Noir: "#2a2a2a",
  Jaune: "#e5c23a",
};

/** Vrai si le visuel est déjà servi par notre bucket Supabase Storage. */
export function isStoredLeaderImage(url: string | null | undefined): boolean {
  return Boolean(url && url.includes(`/storage/v1/object/public/${LEADER_IMAGE_BUCKET}/`));
}
