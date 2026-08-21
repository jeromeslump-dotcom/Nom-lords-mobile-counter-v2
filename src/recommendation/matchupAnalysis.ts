import type { Combat } from "../storage";

export interface MatchupRecord {
  sharedHeroIds: string[];
  heroId: string;
  wins: number;
  losses: number;
  games: number;
  winRate: number;
}

function normalizeTeam(ids: string[]): string[] {
  return [...new Set(ids)].sort();
}

function combinationsOfFour(ids: string[]): string[][] {
  const result: string[][] = [];

  for (let i = 0; i < ids.length; i++) {
    const group = ids.filter((_, index) => index !== i);
    if (group.length === 4) {
      result.push(group);
    }
  }

  return result;
}

/**
 * Compare the fifth hero when four heroes of the player's team are shared.
 *
 * Example:
 *   [A, B, C, D] + Tracker    -> 3 wins / 1 loss
 *   [A, B, C, D] + Black Crow -> 1 win / 3 losses
 *
 * Only combats against a sufficiently similar enemy composition are used.
 * Hero order is ignored.
 */
export function findFiveHeroMatchups(
  enemyIds: string[],
  combats: Combat[],
  minEnemyOverlap = 4
): MatchupRecord[] {
  const targetEnemies = normalizeTeam(enemyIds);
  const results = new Map<
    string,
    { sharedHeroIds: string[]; heroId: string; wins: number; losses: number }
  >();

  for (const combat of combats) {
    const combatEnemies = normalizeTeam(combat.enemy_heroes);
    const enemyOverlap = targetEnemies.filter((id) => combatEnemies.includes(id)).length;

    if (enemyOverlap < minEnemyOverlap) {
      continue;
    }

    const team = normalizeTeam(combat.my_heroes);

    if (team.length !== 5) {
      continue;
    }

    for (const sharedHeroIds of combinationsOfFour(team)) {
      const sharedKey = sharedHeroIds.join(",");
      const fifthHero = team.find((id) => !sharedHeroIds.includes(id));

      if (!fifthHero) {
        continue;
      }

      const key = `${sharedKey}|${fifthHero}`;
      const current = results.get(key) ?? {
        sharedHeroIds,
        heroId: fifthHero,
        wins: 0,
        losses: 0,
      };

      if (combat.won) {
        current.wins += 1;
      } else {
        current.losses += 1;
      }

      results.set(key, current);
    }
  }

  return [...results.values()]
    .map((record) => {
      const games = record.wins + record.losses;

      return {
        ...record,
        games,
        winRate: games > 0 ? record.wins / games : 0,
      };
    })
    .sort(
      (a, b) =>
        b.winRate - a.winRate ||
        b.games - a.games ||
        a.heroId.localeCompare(b.heroId)
    );
}
