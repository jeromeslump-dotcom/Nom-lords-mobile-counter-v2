import type { Combat } from "../storage";
import { RECOMMENDATION_CONFIG } from "./recommendation/recommendationConfig";

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
  reliableRate: number;
}

/**
 * Taux de victoire lissé avec un prior global.
 *
 * Le taux brut reste affichable dans `rate`, tandis que le taux
 * lissé `reliableRate` sert au classement. Cela évite qu'un
 * 100 % sur 1 combat soit considéré comme plus fiable qu'un
 * 92 % sur 25 combats.
 */
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
  const enemyKey = [...enemyIds].sort().join(",");

  const currentKey = [...currentTeamIds].sort().join(",");

  const relevant = combats.filter((combat) => {
    if (combat.status !== "active") {
      return false;
    }

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

    const rawRate = entry.wins / entry.total;
    const reliableRate = reliableWinRate(entry.wins, entry.total);

    /*
     * Classement :
     *
     * 1. meilleur taux fiable (lissé)
     * 2. plus de victoires
     * 3. plus de combats
     *
     * Le taux brut reste disponible pour l'affichage/statistiques.
     */
    if (
      !best ||
      reliableRate > best.reliableRate ||
      (reliableRate === best.reliableRate && entry.wins > 0 &&
        entry.wins > Math.round((best.rate / 100) * best.count)) ||
      (reliableRate === best.reliableRate && entry.total > best.count)
    ) {
      best = {
        ids: key.split(","),
        rate: Math.round(rawRate * 100),
        count: entry.total,
        reliableRate,
      };
    }
  }

  return best;
}
