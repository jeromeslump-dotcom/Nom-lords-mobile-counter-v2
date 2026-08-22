/**
 * Normalise une composition de héros afin que l'ordre ne compte pas.
 */
export function normalizeTeam(ids: string[]): string[] {
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

/**
 * Génère une clé stable pour comparer deux compositions d'équipe.
 */
export function teamKey(ids: string[]): string {
  return normalizeTeam(ids).join("|");
}
