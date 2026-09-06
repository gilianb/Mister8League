/** Heure courante (ms). Isolée pour que les composants serveur restent « purs » aux yeux du linter React. */
export function currentTimeMs(): number {
  return Date.now();
}
