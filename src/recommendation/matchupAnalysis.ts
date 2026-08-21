import type { Combat } from "../storage";

export interface MatchupRecord {
  heroId: string;
  opponentId: string;
  wins: number;
  losses: number;
  games: number;
  winRate: number;
}

function normalizeTeam(ids: string[]): string[] {
  return [...new Set(ids)].sort();
}

/**
 * Finds historical combats where at least `minSharedHeroes` enemy heroes
 * are the same, then compares the candidate fifth hero with the alternatives.
 *
 * The current recommendation engine can use this later as a dedicated
 * historical signal instead of hiding the logic inside counter.ts.
 */
export function findFiveHeroMatchups(
  enemyIds: string[],
  combats: Combat[],
  minSharedHeroes = 4
): MatchupRecord[] {
  const target = normalizeTeam(enemyIds);
  const results = new Map<string, { wins: number; losses: number }>();

  for (const combat of combats) {
    const enemies = normalizeTeam(combat.enemy_heroes);
    const shared = target.filter((id) => enemies.includes(id)).length;

    if (shared < minSharedHeroes) {
      continue;
    }

    const enemyOnly = new Set(target);

    for (const heroId of normalizeTeam(combat.my_heroes)) {
      if (enemyOnly.has(heroId)) {
        continue;
      }

      const current = results.get(heroId) ?? { wins: 0, losses: 0 };

      if (combat.won) {
        current.wins += 1;
      } else {
        current.losses += 1;
      }

      results.set(heroId, current);
    }
  }

  return [...results.entries()]
    .map(([heroId, record]) => ({
      heroId,
      opponentId: "",
      wins: record.wins,
      losses: record.losses,
      games: record.wins + record.losses,
      winRate:
        record.wins + record.losses > 0
          ? record.wins / (record.wins + record.losses)
          : 0,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games || a.heroId.localeCompare(b.heroId));
}
