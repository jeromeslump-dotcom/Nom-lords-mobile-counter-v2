import type { Combat } from "../storage";
import { RECOMMENDATION_CONFIG } from "./recommendation/recommendationConfig";
import { teamKey } from "./teamKey";

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

export function calculateWinRate(
  combats: Combat[],
  enemyIds: string[],
  teamIds: string[]
): WinRateResult | null {
  const enemyKey = teamKey(enemyIds);
  const selectedTeamKey = teamKey(teamIds);

  const matched = combats.filter(
    (combat) =>
      teamKey(combat.enemy_heroes) === enemyKey &&
      teamKey(combat.my_heroes) === selectedTeamKey
  );

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
  reliableRate: number;
}

function reliableWinRate(wins: number, games: number): number {
  if (games <= 0) {
    return RECOMMENDATION_CONFIG.priorRate;
  }

  return (
    (wins + RECOMMENDATION_CONFIG.priorRate * RECOMMENDATION_CONFIG.priorGames) /
    (games + RECOMMENDATION_CONFIG.priorGames)
  );
}

export function findBestHistoricalTeam(
  combats: Combat[],
  enemyIds: string[],
  currentTeamIds: string[]
): BestWinTeamResult | null {
  const enemyKey = teamKey(enemyIds);
  const currentKey = teamKey(currentTeamIds);

  const relevant = combats.filter((combat) => {
    if (combat.status !== "active") {
      return false;
    }

    return teamKey(combat.enemy_heroes) === enemyKey;
  });

  if (relevant.length === 0) {
    return null;
  }

  const teamMap = new Map<string, { wins: number; total: number }>();

  for (const combat of relevant) {
    const key = teamKey(combat.my_heroes);
    const entry = teamMap.get(key) ?? { wins: 0, total: 0 };

    entry.total += 1;
    if (combat.won) {
      entry.wins += 1;
    }

    teamMap.set(key, entry);
  }

  let best: BestWinTeamResult | null = null;

  for (const [key, entry] of teamMap) {
    if (entry.total < 1 || key === currentKey) {
      continue;
    }

    const rawRate = entry.wins / entry.total;
    const reliableRate = reliableWinRate(entry.wins, entry.total);
    const bestWins = best ? Math.round((best.rate / 100) * best.count) : 0;

    if (
      !best ||
      reliableRate > best.reliableRate ||
      (reliableRate === best.reliableRate && entry.wins > bestWins) ||
      (reliableRate === best.reliableRate && entry.total > best.count)
    ) {
      best = {
        ids: key.split("|"),
        rate: Math.round(rawRate * 100),
        count: entry.total,
        reliableRate,
      };
    }
  }

  return best;
}
