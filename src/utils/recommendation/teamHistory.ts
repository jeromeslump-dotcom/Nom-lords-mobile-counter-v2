import type { Combat } from "../../storage";
import { HEROES } from "../../heroes";
import { RECOMMENDATION_CONFIG } from "./recommendationConfig";
import { normalizeTeam, teamKey } from "../teamKey";

export interface HistoricalTeam {
  ids: string[];
  names: string[];
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  reliableWinRate: number;
}

/*
 * Cache par référence du tableau de combats.
 *
 * Pendant un recommendTeam(), le même tableau de combats est
 * analysé de nombreuses fois pour la même composition ennemie.
 * On conserve donc le résultat déjà calculé pour éviter de
 * reconstruire les mêmes statistiques à chaque équipe candidate.
 *
 * WeakMap permet au cache de disparaître automatiquement lorsque
 * le tableau de combats n'est plus utilisé.
 */
const historicalTeamsCache = new WeakMap<
  Combat[],
  Map<string, HistoricalTeam[]>
>();

function reliableWinRate(wins: number, games: number): number {
  if (games <= 0) {
    return RECOMMENDATION_CONFIG.priorRate;
  }

  return (
    (wins +
      RECOMMENDATION_CONFIG.priorRate * RECOMMENDATION_CONFIG.priorGames) /
    (games + RECOMMENDATION_CONFIG.priorGames)
  );
}

export function calculateEnemySimilarity(
  enemyA: string[],
  enemyB: string[]
): number {
  if (enemyA.length !== 5 || enemyB.length !== 5) {
    return 0;
  }

  const setB = new Set(enemyB);
  const commonHeroes = enemyA.filter((heroId) => setB.has(heroId)).length;

  return commonHeroes / 5;
}

function computeHistoricalTeams(
  combats: Combat[],
  enemyTeam: string[],
  minimumSimilarity: number
): HistoricalTeam[] {
  if (enemyTeam.length !== 5) {
    return [];
  }

  const teams = new Map<
    string,
    {
      ids: string[];
      games: number;
      wins: number;
    }
  >();

  for (const combat of combats) {
    if (combat.status !== "active") {
      continue;
    }

    if (combat.enemy_heroes.length !== 5 || combat.my_heroes.length !== 5) {
      continue;
    }

    const similarity = calculateEnemySimilarity(enemyTeam, combat.enemy_heroes);

    if (similarity < minimumSimilarity) {
      continue;
    }

    const ids = normalizeTeam(combat.my_heroes);

    if (ids.length !== 5) {
      continue;
    }

    const key = teamKey(ids);
    const current = teams.get(key) ?? { ids, games: 0, wins: 0 };

    current.games += 1;
    if (combat.won) {
      current.wins += 1;
    }

    teams.set(key, current);
  }

  const results: HistoricalTeam[] = [];

  for (const team of teams.values()) {
    const wins = team.wins;
    const losses = team.games - wins;
    const names = team.ids.map((heroId) => {
      const hero = HEROES.find((item) => item.id === heroId);
      return hero?.name ?? heroId;
    });

    results.push({
      ids: team.ids,
      names,
      games: team.games,
      wins,
      losses,
      winRate: (wins / team.games) * 100,
      reliableWinRate: reliableWinRate(wins, team.games) * 100,
    });
  }

  results.sort(
    (a, b) =>
      b.reliableWinRate - a.reliableWinRate ||
      b.wins - a.wins ||
      b.games - a.games ||
      a.names.join(", ").localeCompare(b.names.join(", "), "fr")
  );

  return results;
}

export function analyzeHistoricalTeams(
  combats: Combat[],
  enemyTeam: string[],
  minimumSimilarity = 0.8
): HistoricalTeam[] {
  if (enemyTeam.length !== 5) {
    return [];
  }

  const cacheKey = `${teamKey(enemyTeam)}|${minimumSimilarity}`;
  let cacheForCombats = historicalTeamsCache.get(combats);

  if (!cacheForCombats) {
    cacheForCombats = new Map();
    historicalTeamsCache.set(combats, cacheForCombats);
  }

  const cached = cacheForCombats.get(cacheKey);

  if (cached) {
    return cached;
  }

  const results = computeHistoricalTeams(combats, enemyTeam, minimumSimilarity);

  cacheForCombats.set(cacheKey, results);

  return results;
}

export function getBestHistoricalTeam(
  combats: Combat[],
  enemyTeam: string[],
  minimumSimilarity = 0.8,
  minimumGames = 1
): HistoricalTeam | null {
  const teams = analyzeHistoricalTeams(combats, enemyTeam, minimumSimilarity);

  return teams.find((team) => team.games >= minimumGames) ?? null;
}

export { normalizeTeam, teamKey };
