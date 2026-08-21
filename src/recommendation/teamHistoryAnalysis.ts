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

export function getHistoricalTeamsAgainst(
  enemyIds: string[],
  combats: Combat[]
): HistoricalTeamRecord[] {
  const enemyKey = normalizeTeam(enemyIds).join(",");
  const records = new Map<string, { teamIds: string[]; wins: number; losses: number }>();

  for (const combat of combats) {
    if (normalizeTeam(combat.enemy_heroes).join(",") !== enemyKey) {
      continue;
    }

    const teamIds = normalizeTeam(combat.my_heroes);
    const teamKey = teamIds.join(",");
    const current = records.get(teamKey) ?? { teamIds, wins: 0, losses: 0 };

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
        b.games - a.games ||
        a.teamIds.join(",").localeCompare(b.teamIds.join(","))
    );
}
