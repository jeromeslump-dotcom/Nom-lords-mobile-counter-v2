import type { Combat } from "../../storage";
import { HEROES } from "../../heroes";
import { RECOMMENDATION_CONFIG } from "./recommendationConfig";

export interface MatchupCandidate {
  heroId: string;
  heroName: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  smoothedWinRate: number;
  confidence: number;
}

export interface FourHeroMatchup {
  baseHeroes: string[];
  candidates: MatchupCandidate[];
  totalGames: number;
}

type CandidateStats = {
  games: number;
  wins: number;
};

/* -----------------------------------------------------------
 * OUTILS
 * --------------------------------------------------------- */

function getHero(heroId: string) {
  return HEROES.find((hero) => hero.id === heroId);
}

function getEnemySet(enemyTeam: string[]): Set<string> {
  return new Set(enemyTeam);
}

function getBaseHeroes(enemyTeam: string[], excludedIndex: number): string[] {
  return enemyTeam.filter((_, index) => index !== excludedIndex);
}

function calculateSmoothedWinRate(wins: number, games: number): number {
  if (games <= 0) {
    return RECOMMENDATION_CONFIG.priorRate * 100;
  }

  return (
    ((wins +
      RECOMMENDATION_CONFIG.priorRate * RECOMMENDATION_CONFIG.priorGames) /
      (games + RECOMMENDATION_CONFIG.priorGames)) *
    100
  );
}

function calculateConfidence(games: number): number {
  if (games <= 0) {
    return 0;
  }

  return Math.min(1, games / (RECOMMENDATION_CONFIG.priorGames * 2));
}

function createCandidate(
  heroId: string,
  stats: CandidateStats
): MatchupCandidate | null {
  const hero = getHero(heroId);

  if (!hero || stats.games <= 0) {
    return null;
  }

  const winRate = (stats.wins / stats.games) * 100;

  return {
    heroId,
    heroName: hero.name,
    games: stats.games,
    wins: stats.wins,
    losses: stats.games - stats.wins,
    winRate,
    smoothedWinRate: calculateSmoothedWinRate(stats.wins, stats.games),
    confidence: calculateConfidence(stats.games),
  };
}

function sortCandidates(candidates: MatchupCandidate[]): MatchupCandidate[] {
  return [...candidates].sort(
    (a, b) =>
      b.smoothedWinRate - a.smoothedWinRate ||
      b.confidence - a.confidence ||
      b.games - a.games ||
      b.winRate - a.winRate ||
      a.heroName.localeCompare(b.heroName, "fr")
  );
}

/* -----------------------------------------------------------
 * ANALYSE 4 + 1
 * --------------------------------------------------------- */

/**
 * Analyse les combats dans lesquels exactement 4 des 5 héros
 * ennemis recherchés sont présents.
 *
 * Le cinquième héros ennemi peut être différent.
 *
 * Exemple :
 *
 *   Tracker
 *   Demon Slayer
 *   Rose Knight
 *   Lore Weaver
 *   + X
 *
 * On observe alors quels héros de notre équipe ont le mieux
 * fonctionné dans ces différentes situations.
 *
 * IMPORTANT :
 *
 * - l'ordre des héros ne compte pas ;
 * - le cinquième héros peut varier ;
 * - les héros de l'équipe ennemie ne sont jamais proposés
 *   comme candidats ;
 * - chaque héros est agrégé à travers les différents groupes
 *   4 + 1.
 */
export function analyzeFourHeroMatchups(
  combats: Combat[],
  enemyTeam: string[]
): FourHeroMatchup[] {
  if (enemyTeam.length !== 5) {
    return [];
  }

  const enemySet = getEnemySet(enemyTeam);

  const results: FourHeroMatchup[] = [];

  /*
   * Les 5 possibilités de retirer un héros ennemi.
   */
  for (
    let excludedIndex = 0;
    excludedIndex < enemyTeam.length;
    excludedIndex++
  ) {
    const baseHeroes = getBaseHeroes(enemyTeam, excludedIndex);

    const baseSet = new Set(baseHeroes);

    const candidateStats = new Map<string, CandidateStats>();

    for (const combat of combats) {
      /*
       * On ne considère que les combats actifs.
       */
if (combat.status === "removed") {
  continue;
}
      /*
       * Une composition doit être complète.
       */
      if (combat.enemy_heroes.length !== 5 || combat.my_heroes.length !== 5) {
        continue;
      }

      /*
       * Sécurité : une composition ennemie valide ne doit
       * pas contenir de doublons.
       */
      const combatEnemySet = new Set(combat.enemy_heroes);

      if (combatEnemySet.size !== 5) {
        continue;
      }

      /*
       * Le combat doit contenir les quatre héros de base.
       */
      const containsBaseHeroes = baseHeroes.every((heroId) =>
        combatEnemySet.has(heroId)
      );

      if (!containsBaseHeroes) {
        continue;
      }

      /*
       * Il doit y avoir exactement un héros ennemi
       * supplémentaire par rapport au groupe de quatre.
       *
       * On calcule cela à partir de l'équipe complète
       * du combat afin d'éviter les faux positifs.
       */
      const fifthHeroes = combat.enemy_heroes.filter(
        (heroId) => !baseSet.has(heroId)
      );

      if (fifthHeroes.length !== 1) {
        continue;
      }

      /*
       * Sécurité supplémentaire :
       * le héros supplémentaire doit bien être différent
       * des quatre héros de base.
       */
      if (baseSet.has(fifthHeroes[0])) {
        continue;
      }

      /*
       * Tous les héros de notre équipe héritent du résultat
       * de ce combat.
       */
      for (const heroId of combat.my_heroes) {
        /*
         * Ne jamais proposer un héros qui faisait partie
         * de l'équipe ennemie.
         */
        if (enemySet.has(heroId)) {
          continue;
        }

        const current = candidateStats.get(heroId) ?? {
          games: 0,
          wins: 0,
        };

        current.games += 1;

        if (combat.won) {
          current.wins += 1;
        }

        candidateStats.set(heroId, current);
      }
    }

    const candidates: MatchupCandidate[] = [];

    for (const [heroId, stats] of candidateStats.entries()) {
      const candidate = createCandidate(heroId, stats);

      if (!candidate) {
        continue;
      }

      candidates.push(candidate);
    }

    if (candidates.length === 0) {
      continue;
    }

    const sortedCandidates = sortCandidates(candidates);

    results.push({
      baseHeroes,
      candidates: sortedCandidates,
      totalGames: sortedCandidates.reduce(
        (total, candidate) => total + candidate.games,
        0
      ),
    });
  }

  return results;
}

/* -----------------------------------------------------------
 * MEILLEUR CANDIDAT GLOBAL
 * --------------------------------------------------------- */

/**
 * Retourne le meilleur héros observé dans les situations 4 + 1.
 *
 * Chaque groupe de quatre est analysé séparément.
 *
 * Le classement privilégie :
 *
 * 1. taux de victoire lissé ;
 * 2. confiance ;
 * 3. nombre de combats ;
 * 4. taux brut ;
 * 5. nom.
 */
export function getBestFourHeroMatchupCandidate(
  combats: Combat[],
  enemyTeam: string[],
  minimumGames = 1
): MatchupCandidate | null {
  const matchups = analyzeFourHeroMatchups(combats, enemyTeam);

  const candidates = matchups
    .flatMap((matchup) => matchup.candidates)
    .filter((candidate) => candidate.games >= minimumGames);

  if (candidates.length === 0) {
    return null;
  }

  return sortCandidates(candidates)[0] ?? null;
}

/* -----------------------------------------------------------
 * SCORE D'UN HÉROS
 * --------------------------------------------------------- */

/**
 * Retourne le meilleur résultat 4 + 1 connu pour un héros donné.
 *
 * Plusieurs groupes de quatre peuvent concerner le même héros.
 *
 * On conserve ici le meilleur résultat historique pour rester
 * compatible avec le moteur actuel de counter.ts.
 */
export function getHeroFourHeroMatchupScore(
  heroId: string,
  combats: Combat[],
  enemyTeam: string[],
  minimumGames = 1
): MatchupCandidate | null {
  /*
   * Un héros faisant partie de l'équipe ennemie ne peut jamais
   * être considéré comme contre.
   */
  if (enemyTeam.includes(heroId)) {
    return null;
  }

  const matchups = analyzeFourHeroMatchups(combats, enemyTeam);

  const candidates = matchups
    .flatMap((matchup) => matchup.candidates)
    .filter(
      (candidate) =>
        candidate.heroId === heroId && candidate.games >= minimumGames
    );

  if (candidates.length === 0) {
    return null;
  }

  return sortCandidates(candidates)[0] ?? null;
}
