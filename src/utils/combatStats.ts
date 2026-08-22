import type { Combat } from "../storage";

/**
 * Counts how many times each hero appears in recorded combats.
 * The original App.tsx logic counts both enemy and own-team appearances.
 */
export function calculateHeroUsage(combats: Combat[]): Record<string, number> {
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
 * Calculates the exact win rate for the selected enemy team
 * and the selected/recommended team.
 *
 * A combat is counted only when the 5 enemy heroes and the
 * 5 heroes of our team match exactly, regardless of order.
 */
export function calculateWinRate(
  combats: Combat[],
  enemyIds: string[],
  teamIds: string[]
): WinRateResult | null {
  const enemyKey = [...enemyIds].sort().join(",");

  const teamKey = [...teamIds].sort().join(",");

  const matched = combats.filter((combat) => {
    const combatEnemyKey = [...combat.enemy_heroes].sort().join(",");

    const combatTeamKey = [...combat.my_heroes].sort().join(",");

    return combatEnemyKey === enemyKey && combatTeamKey === teamKey;
  });

  if (matched.length === 0) {
    return null;
  }

  const wins = matched.filter((combat) => combat.won).length;

  return {
    rate: (wins / matched.length) * 100,
    count: matched.length,
  };
}

export interface BestWinTeamResult {
  ids: string[];
  rate: number;
  count: number;
}

export function findBestHistoricalTeam(
  combats: Combat[],
  enemyIds: string[],
  currentTeamIds: string[]
): BestWinTeamResult | null {
  const enemyKey = [...enemyIds].sort().join(",");

  const currentKey = [...currentTeamIds].sort().join(",");

  const relevant = combats.filter((combat) => {
    const combatEnemyKey = [...combat.enemy_heroes].sort().join(",");

    return combatEnemyKey === enemyKey;
  });

  if (relevant.length === 0) {
    return null;
  }

  const teamMap = new Map<
    string,
    {
      wins: number;
      total: number;
    }
  >();

  for (const combat of relevant) {
    const key = [...combat.my_heroes].sort().join(",");

    const entry = teamMap.get(key) ?? {
      wins: 0,
      total: 0,
    };

    entry.total += 1;

    if (combat.won) {
      entry.wins += 1;
    }

    teamMap.set(key, entry);
  }

  let best: BestWinTeamResult | null = null;

  for (const [key, entry] of teamMap) {
    /*
     * Une équipe doit avoir au moins un combat historique.
     */
    if (entry.total < 1) {
      continue;
    }

    /*
     * Ne pas proposer l'équipe actuellement recommandée.
     */
    if (key === currentKey) {
      continue;
    }

    const rate = Math.round((entry.wins / entry.total) * 100);

    /*
     * Classement :
     *
     * 1. meilleur taux de victoire
     * 2. en cas d'égalité, plus de combats
     */
    if (
      !best ||
      rate > best.rate ||
      (rate === best.rate && entry.total > best.count)
    ) {
      best = {
        ids: key.split(","),
        rate,
        count: entry.total,
      };
    }
  }

  return best;
}
