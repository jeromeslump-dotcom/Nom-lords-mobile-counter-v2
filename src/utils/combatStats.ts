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
  const relevant = combats.filter(
    (combat) =>
      combat.enemy_heroes.filter((id) =>
        enemyIds.includes(id)
      ).length === 5
  );

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
    const key = [...combat.my_heroes]
      .sort()
      .join(",");

    const entry =
      teamMap.get(key) ?? {
        wins: 0,
        total: 0,
      };

    entry.total++;

    if (combat.won) {
      entry.wins++;
    }

    teamMap.set(key, entry);
  }

  let best: BestWinTeamResult | null = null;

  for (const [key, entry] of teamMap) {
    if (entry.total < 2) {
      continue;
    }

    const rate = Math.round(
      (entry.wins / entry.total) * 100
    );

    if (
      !best ||
      rate > best.rate ||
      (rate === best.rate &&
        entry.total > best.count)
    ) {
      best = {
        ids: key.split(","),
        rate,
        count: entry.total,
      };
    }
  }

  if (!best) {
    return null;
  }

  const currentKey = [...currentTeamIds]
    .sort()
    .join(",");

  const bestKey = [...best.ids]
    .sort()
    .join(",");

  if (bestKey === currentKey) {
    return null;
  }

  return best;
}