import type { Combat } from "../storage";

export interface HistoricalTeamRecord {
  teamIds: string[];
  wins: number;
  losses: number;
  games: number;
  winRate: number;
}

function normalizeTeam(ids: string[]): string[] {
  return [...new Set(ids)].sort();
}

/**
 * Returns historical five-hero teams used against the selected enemy
 * composition. Enemy order never matters.
 *
 * With minEnemyOverlap = 5 this is an exact enemy-composition search.
 * With 4 it also learns from fights against a very similar composition.
 */
export function getHistoricalTeamsAgainst(
  enemyIds: string[],
  combats: Combat[],
  minEnemyOverlap = 5
): HistoricalTeamRecord[] {
  const targetEnemies = normalizeTeam(enemyIds);
  const records = new Map<
    string,
    { teamIds: string[]; wins: number; losses: number }
  >();

  for (const combat of combats) {
    const combatEnemies = normalizeTeam(combat.enemy_heroes);
    const enemyOverlap = targetEnemies.filter((id) => combatEnemies.includes(id)).length;

    if (enemyOverlap < minEnemyOverlap) {
      continue;
    }

    const teamIds = normalizeTeam(combat.my_heroes);

    if (teamIds.length !== 5) {
      continue;
    }

    const teamKey = teamIds.join(",");
    const current = records.get(teamKey) ?? {
      teamIds,
      wins: 0,
      losses: 0,
    };

    if (combat.won) {
      current.wins += 1;
    } else {
      current.losses += 1;
    }

    records.set(teamKey, current);
  }

  return [...records.values()]
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
        b.wins - a.wins ||
        a.losses - b.losses ||
        b.games - a.games ||
        a.teamIds.join(",").localeCompare(b.teamIds.join(","))
    );
}
