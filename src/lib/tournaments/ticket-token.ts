import crypto from "crypto";

/** Jeton opaque (URL-safe) imprimé dans le QR code du billet. */
export function generateTicketToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Seul le hachage est stocké en base. */
export function hashTicketToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
