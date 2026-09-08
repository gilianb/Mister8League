// ------------------------------------------------------------------
// Saisie à réafficher après une erreur de formulaire.
//
// React réinitialise le formulaire dès que la Server Action rend la main.
// Sans renvoyer la saisie, une simple case oubliée renvoie l'utilisateur
// devant des champs vides : à l'inscription, c'est toute l'adresse de
// facturation qui est à retaper. Pire, un champ obligatoire vidé (l'e-mail
// de connexion) fait refuser la soumission suivante par le navigateur, en
// silence : on clique, rien ne se passe.
//
// Les valeurs renvoyées reviennent en `defaultValue` côté formulaire.
// ------------------------------------------------------------------

/**
 * Relève les champs à réafficher.
 *
 * N'y faire figurer que des champs sans secret : jamais un mot de passe, et
 * jamais un fichier — le navigateur interdit de repositionner un `input[file]`.
 *
 * @param formData données soumises
 * @param keys noms des champs à conserver
 */
export function keepValues(formData: FormData, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string" && value !== "") out[key] = value;
  }
  return out;
}
