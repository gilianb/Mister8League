// ------------------------------------------------------------------
// Noms de relations à employer dans les `select` PostgREST.
//
// Quand deux clés étrangères relient les mêmes tables, PostgREST refuse
// l'embed abrégé : il ne sait pas laquelle suivre et répond PGRST201
// (« Could not embed because more than one relationship was found »).
// La requête entière échoue alors — pas seulement la jointure.
// ------------------------------------------------------------------

/**
 * `registrations` pointe deux fois vers `profiles` : `profile_id` (l'inscrit)
 * et `checked_in_by` (l'admin qui a validé la présence). Un `profiles(...)` nu
 * est donc ambigu : il faut nommer la contrainte pour viser l'inscrit.
 *
 * À utiliser dans tout `select` interrogeant `registrations`, y compris quand
 * la table est elle-même imbriquée (`registration:registrations(...)`).
 */
export const REGISTRANT_PROFILE = "profiles!registrations_profile_id_fkey";
