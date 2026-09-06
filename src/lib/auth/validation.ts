// Règles de validation des champs de compte. Module pur (partagé
// client / serveur), messages en français.

export const PSEUDO_RE = /^[a-z0-9_.-]{3,24}$/i;

export function validatePseudo(v: string): string | null {
  const s = (v ?? "").trim();
  if (!s) return "Choisissez un pseudo.";
  if (!PSEUDO_RE.test(s)) {
    return "3 à 24 caractères : lettres, chiffres, tirets, points ou underscores.";
  }
  return null;
}

export function normalizeBandaiId(v: string): string {
  return String(v ?? "").replace(/\D+/g, "");
}

export function validateBandaiId(v: string): string | null {
  const s = normalizeBandaiId(v);
  if (!s) return "Indiquez votre numéro de membre Bandai.";
  if (s.length < 6 || s.length > 12) return "Le numéro de membre Bandai compte entre 6 et 12 chiffres.";
  return null;
}

export function validateFullName(v: string): string | null {
  const s = (v ?? "").trim();
  if (s.length < 2) return "Indiquez votre nom complet.";
  if (s.length > 80) return "Nom trop long.";
  return null;
}

export function validateEmail(v: string): string | null {
  const s = (v ?? "").trim();
  if (!s) return "Indiquez votre adresse e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) || s.length > 320) return "Adresse e-mail invalide.";
  return null;
}

export function validatePassword(v: string): string | null {
  const s = v ?? "";
  if (s.length < 8) return "8 caractères minimum.";
  if (s.length > 128) return "Mot de passe trop long.";
  return null;
}

export function normalizeEmail(v: string): string {
  return (v ?? "").trim().toLowerCase();
}
