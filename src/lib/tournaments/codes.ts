/** Code court et lisible d'une inscription, ex. « T-3F9A2B1C ». */
export function registrationCode(id: string): string {
  return `T-${String(id).replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/** Messages FR des erreurs codées renvoyées par la fonction SQL reserve_seat. */
export function humanizeReserveError(message: string): string {
  const m = (message || "").toLowerCase();
  if (m.includes("profile_incomplete")) return "Complétez votre profil (pseudo, nom complet, numéro Bandai) avant de vous inscrire.";
  if (m.includes("not_authenticated")) return "Connectez-vous pour vous inscrire.";
  if (m.includes("registration_not_open_yet")) return "Les inscriptions ne sont pas encore ouvertes.";
  if (m.includes("registration_closed")) return "Les inscriptions sont closes pour ce tournoi.";
  if (m.includes("event_full")) return "Ce tournoi est complet.";
  if (m.includes("already_registered")) return "Vous êtes déjà inscrit à ce tournoi.";
  if (m.includes("deck_not_found")) return "Deck introuvable.";
  return "L'inscription a échoué. Réessayez dans un instant.";
}
