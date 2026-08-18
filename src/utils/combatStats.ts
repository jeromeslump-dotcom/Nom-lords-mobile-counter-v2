import type { Combat } from "../storage";

/**
 * Counts how many times each hero appears in recorded combats.
 * The original App.tsx logic counts both enemy and own-team appearances.
 */
export function calculateHeroUsage(
  combats: Combat[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const combat of combats) {
    for (const id of combat.enemy_heroes) {
      counts[id] = (counts[id] ?? 0) + 1;
    }

    for (const id of combat.my_heroes) {
      counts[id] = (counts[id] ?? 0) + 1;
    }
  }

  return counts;
}

export interface WinRateResult {
  rate: number;
  count: number;
}

/**
 * Calculates the win rate using the same matching rules as App.tsx:
 * first try a >=4 enemy / >=4 own-team match, then fall back to
 * combats matching at least 4 enemy heroes.
 */
export function calculateWinRate(
  combats: Combat[],
  enemyIds: string[],
  teamIds: string[]
): WinRateResult | null {
  const teamMatched = combats.filter((combat) => {
    const enemyOverlap = combat.enemy_heroes.filter((id) =>
      enemyIds.includes(id)
    ).length;

    const myOverlap = combat.my_heroes.filter((id) =>
      teamIds.includes(id)
    ).length;

    return enemyOverlap >= 4 && myOverlap >= 4;
  });

  if (teamMatched.length > 0) {
    const wins = teamMatched.filter((combat) => combat.won).length;

    return {
      rate: Math.round((wins / teamMatched.length) * 100),
      count: teamMatched.length,
    };
  }

  const enemyMatched = combats.filter(
    (combat) =>
      combat.enemy_heroes.filter((id) => enemyIds.includes(id)).length >= 4
  );

  if (enemyMatched.length === 0) {
    return null;
  }

  const wins = enemyMatched.filter((combat) => combat.won).length;

  return {
    rate: Math.round((wins / enemyMatched.length) * 100),
    count: enemyMatched.length,
  };
}
