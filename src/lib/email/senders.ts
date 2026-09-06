// Enveloppes des e-mails de tournoi : expéditeur no-reply, réponses vers
// l'adresse tournois, notifications internes vers la boîte admin.

export const TOURNAMENT_CONTACT_EMAIL = process.env.EMAIL_TOURNAMENT_REPLY_TO?.trim() || "as@mister-8.com";
export const TOURNAMENT_CONTACT_LABEL = `${TOURNAMENT_CONTACT_EMAIL} (tournois uniquement)`;

const DEFAULT_FROM = "Mister 8 Tournament League (no-reply) <no-reply@mister-8.com>";

export function tournamentSender(): { from: string; replyTo: string } {
  return {
    from: process.env.EMAIL_TOURNAMENT_FROM?.trim() || DEFAULT_FROM,
    replyTo: TOURNAMENT_CONTACT_EMAIL,
  };
}

export function tournamentAdminRecipient(): string {
  return process.env.EMAIL_TOURNAMENT_ADMIN_TO?.trim() || TOURNAMENT_CONTACT_EMAIL;
}

export function tournamentMailto(eventTitle?: string): string {
  const subject = eventTitle ? `Question tournoi - ${eventTitle}` : "Question tournoi";
  return `mailto:${TOURNAMENT_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
