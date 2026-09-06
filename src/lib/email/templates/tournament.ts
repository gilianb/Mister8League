// Gabarits FR des e-mails d'inscription (joueur + admin). Texte + HTML.

export type TournamentEmailContext = {
  registrationCode: string;
  eventTitle: string;
  eventDateLabel: string; // « Dimanche 27 septembre 2026 »
  eventStartTimeLabel: string; // « 14 h 00 »
  eventArrivalTimeLabel: string; // « 13 h 30 »
  venueText: string;
  participantName: string;
  participantEmail: string;
  paymentLabel: string;
  amountLabel: string;
  leaderName: string | null;
  eventUrl: string;
  accountUrl: string;
  contactEmail: string;
};

function esc(s: string) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function layout(title: string, body: string, footer: string) {
  return `
  <div style="background:#221f1c;padding:32px 16px;font-family:-apple-system,Segoe UI,Inter,sans-serif;color:#f3ebda">
    <div style="max-width:560px;margin:0 auto">
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:20px;font-weight:800;letter-spacing:.04em;color:#f7f0df">MISTER 8</div>
        <div style="font-size:10px;font-weight:700;letter-spacing:.28em;color:#f6c36b">TOURNAMENT LEAGUE</div>
      </div>
      <div style="background:#2b2825;border:1px solid rgba(246,195,107,.2);border-radius:16px;padding:24px">
        <h1 style="margin:0 0 12px;font-size:20px;color:#f7f0df">${title}</h1>
        ${body}
      </div>
      <p style="margin:20px 0 0;font-size:12px;color:#8e8672;line-height:1.5">${footer}</p>
    </div>
  </div>`;
}

function detailsTable(rows: Array<[string, string]>) {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#c9bfa8;width:38%;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#f7f0df;font-weight:600">${esc(v)}</td></tr>`
    )
    .join("")}</table>`;
}

export function buyerConfirmationTemplate(ctx: TournamentEmailContext) {
  const subject = `✅ Inscription confirmée — ${ctx.eventTitle} (${ctx.registrationCode})`;
  const rows: Array<[string, string]> = [
    ["Tournoi", ctx.eventTitle],
    ["Date", `${ctx.eventDateLabel} · début ${ctx.eventStartTimeLabel}`],
    ["Arrivée conseillée", `${ctx.eventArrivalTimeLabel} (enregistrement Bandai TCG+)`],
    ["Lieu", ctx.venueText],
    ["Participant", ctx.participantName],
    ["Inscription", ctx.registrationCode],
    ["Paiement", `${ctx.paymentLabel} · ${ctx.amountLabel}`],
  ];
  if (ctx.leaderName) rows.push(["Leader déclaré", ctx.leaderName]);

  const text = [
    `Bonjour ${ctx.participantName},`,
    ``,
    `Votre inscription est confirmée !`,
    ``,
    ...rows.map(([k, v]) => `${k} : ${v}`),
    ``,
    `Votre billet PDF est joint à cet e-mail : présentez-le (téléphone ou papier) à l'accueil pour le check-in.`,
    `Pensez à saisir votre decklist dans l'app Bandai TCG+ avant le tournoi.`,
    ``,
    `Retrouvez vos inscriptions et vos billets dans votre espace joueur : ${ctx.accountUrl}`,
    `Page du tournoi : ${ctx.eventUrl}`,
    ``,
    `À très vite,`,
    `L'équipe Mister 8`,
    ``,
    `—`,
    `Cet e-mail est envoyé depuis une adresse no-reply. Pour toute question sur ce tournoi : ${ctx.contactEmail} (tournois uniquement).`,
  ].join("\n");

  const html = layout(
    "Inscription confirmée ✅",
    `<p style="margin:0;color:#c9bfa8">Bonjour <strong style="color:#f7f0df">${esc(ctx.participantName)}</strong>, votre place est réservée.</p>
     ${detailsTable(rows)}
     <p style="margin:0 0 12px;color:#f3ebda"><strong>Votre billet PDF est joint.</strong> Présentez-le à l'accueil (téléphone ou papier) pour le check-in.</p>
     <p style="margin:0 0 20px;color:#c9bfa8;font-size:13px">Pensez à saisir votre decklist dans l'app Bandai TCG+ avant le tournoi.</p>
     <a href="${esc(ctx.accountUrl)}" style="display:inline-block;background:#f6c36b;color:#181614;font-weight:700;padding:12px 20px;border-radius:10px;text-decoration:none">Mon espace joueur</a>
     <span style="display:inline-block;width:8px"></span>
     <a href="${esc(ctx.eventUrl)}" style="display:inline-block;border:1px solid rgba(246,195,107,.5);color:#f6c36b;font-weight:600;padding:12px 20px;border-radius:10px;text-decoration:none">Page du tournoi</a>`,
    `Cet e-mail est envoyé depuis une adresse no-reply. Pour toute question sur ce tournoi : <a href="mailto:${esc(ctx.contactEmail)}" style="color:#f6c36b">${esc(ctx.contactEmail)}</a> (tournois uniquement).`
  );
  return { subject, text, html };
}

export function adminNotificationTemplate(ctx: TournamentEmailContext) {
  const subject = `🎟️ Nouvelle inscription — ${ctx.eventTitle} (${ctx.registrationCode})`;
  const rows: Array<[string, string]> = [
    ["Tournoi", ctx.eventTitle],
    ["Date", `${ctx.eventDateLabel} · ${ctx.eventStartTimeLabel}`],
    ["Participant", ctx.participantName],
    ["E-mail", ctx.participantEmail],
    ["Inscription", ctx.registrationCode],
    ["Paiement", `${ctx.paymentLabel} · ${ctx.amountLabel}`],
  ];
  if (ctx.leaderName) rows.push(["Leader déclaré", ctx.leaderName]);
  const text = [`Nouvelle inscription :`, ``, ...rows.map(([k, v]) => `${k} : ${v}`)].join("\n");
  const html = layout("Nouvelle inscription 🎟️", detailsTable(rows), "Notification automatique de la plateforme de la ligue.");
  return { subject, text, html };
}
