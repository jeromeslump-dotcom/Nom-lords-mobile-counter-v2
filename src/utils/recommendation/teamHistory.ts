import type { Combat } from "../../storage";
import { HEROES } from "../../heroes";
import { RECOMMENDATION_CONFIG } from "./recommendationConfig";

export interface HistoricalTeam {
  ids: string[];
  names: string[];
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  reliableWinRate: number;
}

/**
 * Normalise une équipe afin que son ordre ne compte.
 *
 * Exemple :
 * [tracker, blackCrow, roseKnight]
 * et
 * [roseKnight, tracker, blackCrow]
 *
 * représentent la même équipe historique.
 */
function normalizeTeam(ids: string[]): string[] {
  return [...new Set(ids)].sort((a, b) => a.localeCompare(b));
}

function teamKey(ids: string[]): string {
  return normalizeTeam(ids).join("|");
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

/**
 * Calcule la similarité entre deux compositions ennemies.
 *
 * 5 héros identiques = 100 %
 * 4 héros identiques = 80 %
 * 3 héros identiques = 60 %
 * etc.
 */
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

/**
 * Recherche les équipes complètes ayant déjà combattu une composition
 * ennemie identique ou similaire.
 *
 * Par défaut :
 * - 5/5 héros identiques = correspondance parfaite
 * - 4/5 = très similaire
 * - 3/5 ou moins = ignoré
 *
 * Le minimum de similarité peut être ajusté.
 */
export function analyzeHistoricalTeams(
  combats: Combat[],
  enemyTeam: string[],
  minimumSimilarity = 0.8
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

    const key = ids.join("|");

    const current = teams.get(key) ?? {
      ids,
      games: 0,
      wins: 0,
    };

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

/**
 * Retourne directement la meilleure équipe historique.
 *
 * Le classement utilise un taux de victoire lissé avec le prior
 * global du moteur afin qu'un petit échantillon ne domine pas
 * automatiquement un historique beaucoup plus fourni.
 */
export function getBestHistoricalTeam(
  combats: Combat[],
  enemyTeam: string[],
  minimumSimilarity = 0.8,
  minimumGames = 1
): HistoricalTeam | null {
  const teams = analyzeHistoricalTeams(combats, enemyTeam, minimumSimilarity);

  return teams.find((team) => team.games >= minimumGames) ?? null;
}

export { teamKey };
