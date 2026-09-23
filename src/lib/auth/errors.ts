// Traduction des messages d'erreur Supabase Auth les plus courants.
// Module pur (partagé client / serveur, testable sans Supabase).

/** Message français pour une erreur Supabase Auth, ou le message d'origine s'il est inconnu. */
export function frenchAuthError(message: string): string {
  const m = (message ?? "").toLowerCase();

  // « For security purposes, you can only request this after 42 seconds. »
  const wait = m.match(/after (\d+) seconds?/);
  if (wait) {
    const s = Number(wait[1]);
    return `Par sécurité, patientez ${s} seconde${s > 1 ? "s" : ""} avant de refaire une demande.`;
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Trop de demandes envoyées. Réessayez dans quelques minutes.";
  }
  if (m.includes("should be different from the old password") || m.includes("same_password")) {
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  }
  if (m.includes("password should be at least") || m.includes("weak password") || m.includes("weak_password")) {
    return "Mot de passe trop faible : 8 caractères minimum, évitez les mots de passe courants.";
  }
  if (m.includes("expired") || (m.includes("invalid") && (m.includes("token") || m.includes("otp") || m.includes("link")))) {
    return "Ce lien est invalide ou a expiré. Demandez-en un nouveau.";
  }
  if (m.includes("auth session missing") || m.includes("session not found")) {
    return "Session introuvable. Ouvrez à nouveau le lien reçu par e-mail.";
  }
  return message;
}
