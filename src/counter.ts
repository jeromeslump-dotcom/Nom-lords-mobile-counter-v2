import { Hero, HEROES, CLASS_BEATS, heroRole, HeroRole } from "./heroes";
import type { Combat } from "./storage";

import { RECOMMENDATION_CONFIG } from "./utils/recommendation/recommendationConfig";
import { calculateRecommendationScore } from "./utils/recommendation/recommendationScore";
import { getHeroFourHeroMatchupScore } from "./utils/recommendation/matchupAnalysis";
import { analyzeHistoricalTeams } from "./utils/recommendation/teamHistory";
import { teamKey } from "./utils/teamKey";

export interface CounterTarget {
  id: string;
  score: number;
  cls: boolean;
}

export interface CounterPick {
  hero: Hero;
  score: number;
  targets: CounterTarget[];
}

export interface TeamAnalysis {
  score: number;
  counterScore: number;
  historyScore: number;
  synergyScore: number;
  roleScore: number;
  matchupScore: number;
  coverage: number;
}

const TEAM_SIZE = 5;
const BEAM_WIDTH = 180;

/*
 * Poids généraux du moteur.
 */
const COUNTER_WEIGHT = RECOMMENDATION_CONFIG.counter;
const HISTORY_WEIGHT = RECOMMENDATION_CONFIG.history;
const SYNERGY_WEIGHT = RECOMMENDATION_CONFIG.synergy;
const ROLE_WEIGHT = RECOMMENDATION_CONFIG.role;

/*
 * Prior historique.
 */
const PRIOR_RATE = RECOMMENDATION_CONFIG.priorRate;
const PRIOR_GAMES = RECOMMENDATION_CONFIG.priorGames;

/*
 * Une équipe exacte qui a déjà perdu plusieurs fois
 * sans aucune victoire contre exactement la même
 * composition ennemie ne doit pas être reproposée.
 */
const MIN_EXACT_LOSSES_TO_AVOID = 2;

/* -----------------------------------------------------------
 * COMBATS ACTIFS
 * --------------------------------------------------------- */

/*
 * Seuls les combats actifs doivent influencer le moteur.
 *
 * IMPORTANT :
 * Les anciens combats peuvent ne pas posséder de champ
 * status dans certaines anciennes données.
 *
 * Dans ce cas, ils restent utilisables.
 *
 * Un combat explicitement marqué "removed" est exclu.
 */
function getActiveCombats(combats: Combat[]): Combat[] {
  /*
   * Supabase ne fournit pas forcément de colonne `status`.
   *
   * Si status existe, seuls les combats explicitement
   * retirés sont ignorés.
   *
   * Si status n'existe pas / vaut undefined,
   * le combat reste actif et participe aux calculs.
   */
  return combats.filter((combat) => combat.status !== "removed");
}

/* -----------------------------------------------------------
 * CONTRES THÉORIQUES
 * --------------------------------------------------------- */

function scorePair(c: Hero, e: Hero): CounterTarget {
  const cls = CLASS_BEATS[c.cls] === e.cls;

  return {
    id: e.id,
    score: cls ? 1 : 0,
    cls,
  };
}

function getEnemies(enemyIds: string[]): Hero[] {
  const set = new Set(enemyIds);

  return HEROES.filter((h) => set.has(h.id));
}

function pairScore(c: Hero, e: Hero): number {
  const cls = CLASS_BEATS[c.cls] === e.cls;

  return cls ? 1 : 0;
}

function buildHeroCounters(enemies: Hero[]) {
  return new Map(
    HEROES.map((hero) => [
      hero.id,
      enemies.map((enemy) => scorePair(hero, enemy)),
    ])
  );
}

/* -----------------------------------------------------------
 * HISTORIQUE INDIVIDUEL
 * --------------------------------------------------------- */

function historyStats(heroId: string, enemyIds: string[], combats: Combat[]) {
  const enemySet = new Set(enemyIds);

  let weightedWins = 0;
  let weightedGames = 0;

  let exactWins = 0;
  let exactGames = 0;

  for (const combat of combats) {
    if (!combat.my_heroes.includes(heroId)) {
      continue;
    }

    const overlap = combat.enemy_heroes.filter((id) => enemySet.has(id)).length;

    if (overlap === 0) {
      continue;
    }

    const weight = overlap / enemyIds.length;

    weightedGames += weight;

    if (combat.won) {
      weightedWins += weight;
    }

    if (overlap === enemyIds.length) {
      exactGames++;

      if (combat.won) {
        exactWins++;
      }
    }
  }

  return {
    rate: weightedGames > 0 ? weightedWins / weightedGames : PRIOR_RATE,

    games: weightedGames,

    exactRate: exactGames > 0 ? exactWins / exactGames : null,

    exactGames,
    exactWins,
  };
}

function smoothedRate(wins: number, games: number, prior = PRIOR_RATE): number {
  return (wins + prior * PRIOR_GAMES) / (games + PRIOR_GAMES);
}

/* -----------------------------------------------------------
 * HISTORIQUE EXACT D'UNE ÉQUIPE
 * --------------------------------------------------------- */

function getExactTeamRecord(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
) {
  const normalizedTeamKey = teamKey(team.map((h) => h.id));
  const normalizedEnemyKey = teamKey(enemyIds);

  let wins = 0;
  let losses = 0;

  for (const combat of combats) {
    const combatTeamKey = teamKey(combat.my_heroes);

    if (combatTeamKey !== normalizedTeamKey) {
      continue;
    }

    const combatEnemyKey = teamKey(combat.enemy_heroes);

    if (combatEnemyKey !== normalizedEnemyKey) {
      continue;
    }

    if (combat.won) {
      wins++;
    } else {
      losses++;
    }
  }

  return {
    wins,
    losses,
    games: wins + losses,
  };
}

/* -----------------------------------------------------------
 * RECHERCHE D'UNE ÉQUIPE EXACTE HISTORIQUE
 * --------------------------------------------------------- */

/**
 * Cherche toutes les équipes qui ont réellement été jouées
 * contre exactement la même composition ennemie.
 *
 * L'ordre des héros ne compte pas.
 *
 * Une équipe avec au moins une victoire est prioritaire
 * sur le moteur théorique.
 *
 * Classement :
 *
 * 1. taux de victoire réel
 * 2. nombre de victoires
 * 3. nombre de combats
 */
function getBestExactHistoricalTeam(
  enemyIds: string[],
  combats: Combat[]
): Hero[] | null {
  if (enemyIds.length !== TEAM_SIZE) {
    return null;
  }

  const normalizedEnemyKey = teamKey(enemyIds);

  const records = new Map<
    string,
    {
      ids: string[];
      wins: number;
      losses: number;
    }
  >();

  for (const combat of combats) {
    if (combat.my_heroes.length !== TEAM_SIZE) {
      continue;
    }

    if (combat.enemy_heroes.length !== TEAM_SIZE) {
      continue;
    }

    const combatEnemyKey = teamKey(combat.enemy_heroes);

    if (combatEnemyKey !== normalizedEnemyKey) {
      continue;
    }

    /*
     * Sécurité contre les compositions invalides.
     */
    if (new Set(combat.my_heroes).size !== TEAM_SIZE) {
      continue;
    }

    const teamIds = teamKey(combat.my_heroes).split("|");
    const normalizedTeamKey = teamKey(teamIds);

    const current = records.get(normalizedTeamKey) ?? {
      ids: teamIds,
      wins: 0,
      losses: 0,
    };

    if (combat.won) {
      current.wins++;
    } else {
      current.losses++;
    }

    records.set(normalizedTeamKey, current);
  }

  const valid = [...records.values()].filter((record) => record.wins > 0);

  if (valid.length === 0) {
    return null;
  }

  valid.sort((a, b) => {
    const aGames = a.wins + a.losses;
    const bGames = b.wins + b.losses;

    const aRate = aGames > 0 ? a.wins / aGames : 0;
    const bRate = bGames > 0 ? b.wins / bGames : 0;

    return (
      bRate - aRate ||
      b.wins - a.wins ||
      bGames - aGames ||
      teamKey(a.ids).localeCompare(teamKey(b.ids), "fr")
    );
  });

  const best = valid[0];

  if (!best) {
    return null;
  }

  const heroes = best.ids
    .map((id) => HEROES.find((hero) => hero.id === id))
    .filter((hero): hero is Hero => Boolean(hero));

  return heroes.length === TEAM_SIZE ? heroes : null;
}

/* -----------------------------------------------------------
 * ÉQUIPE À ÉVITER
 * --------------------------------------------------------- */

function shouldAvoidExactTeam(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
): boolean {
  const record = getExactTeamRecord(team, enemyIds, combats);

  return record.wins === 0 && record.losses >= MIN_EXACT_LOSSES_TO_AVOID;
}

/* -----------------------------------------------------------
 * HISTORIQUE D'UNE ÉQUIPE
 * --------------------------------------------------------- */

function teamHistoryScore(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
): number {
  if (combats.length === 0 || team.length !== TEAM_SIZE) {
    return 0;
  }

  const historicalTeams = analyzeHistoricalTeams(combats, enemyIds, 0.8);

  if (historicalTeams.length === 0) {
    return 0;
  }

  const normalizedTeamKey = teamKey(team.map((hero) => hero.id));

  const historicalTeam = historicalTeams.find(
    (candidate) => teamKey(candidate.ids) === normalizedTeamKey
  );

  if (!historicalTeam) {
    return 0;
  }

  const rate = historicalTeam.winRate / 100;

  const confidence = Math.min(2.5, Math.sqrt(historicalTeam.games));

  return (rate - PRIOR_RATE) * 55 * confidence;
}

/* -----------------------------------------------------------
 * HISTORIQUE EXACT
 * --------------------------------------------------------- */

function exactTeamHistoryScore(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
): number {
  const record = getExactTeamRecord(team, enemyIds, combats);

  const { wins, losses, games } = record;

  if (games === 0) {
    return 0;
  }

  if (wins === 0 && losses >= MIN_EXACT_LOSSES_TO_AVOID) {
    return -1000;
  }

  const rate = smoothedRate(wins, games);

  const confidence = Math.min(2.5, Math.sqrt(games));

  return (rate - PRIOR_RATE) * 55 * confidence;
}

/* -----------------------------------------------------------
 * BONUS POUR LES HÉROS D'UNE VICTOIRE
 * --------------------------------------------------------- */

function heroHistoryBonus(
  heroId: string,
  enemyIds: string[],
  combats: Combat[]
): number {
  const enemySet = new Set(enemyIds);

  let score = 0;

  for (const combat of combats) {
    if (!combat.my_heroes.includes(heroId)) {
      continue;
    }

    const overlap = combat.enemy_heroes.filter((id) => enemySet.has(id)).length;

    if (overlap < 3) {
      continue;
    }

    const enemyWeight = overlap / enemyIds.length;

    if (combat.won) {
      score += enemyWeight * 8;
    } else {
      score -= enemyWeight * 3;
    }
  }

  return score;
}

/* -----------------------------------------------------------
 * ÉQUILIBRE DES RÔLES
 * --------------------------------------------------------- */

function roleBalance(team: Hero[]): number {
  const roles = new Map<HeroRole, number>();

  for (const hero of team) {
    const role = heroRole(hero);

    roles.set(role, (roles.get(role) ?? 0) + 1);
  }

  let score = 0;

  if ((roles.get("Tank") ?? 0) >= 1) {
    score += 2;
  }

  if ((roles.get("Support") ?? 0) >= 1) {
    score += 2;
  }

  if ((roles.get("Damage") ?? 0) >= 2) {
    score += 2;
  }

  if (new Set(team.map((h) => h.cls)).size >= 2) {
    score += 1;
  }

  return score;
}

/* -----------------------------------------------------------
 * SYNERGIE
 * --------------------------------------------------------- */

function synergyScore(team: Hero[], enemies: Hero[]): number {
  let score = 0;

  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      if (team[i].cls !== team[j].cls) {
        score += 0.25;
      }
    }
  }

  const covered = new Set<string>();

  for (const hero of team) {
    for (const enemy of enemies) {
      if (pairScore(hero, enemy) > 0) {
        covered.add(enemy.id);
      }
    }
  }

  score += covered.size * 0.35;

  return score;
}

/* -----------------------------------------------------------
 * SCORE DE CONTRE
 * --------------------------------------------------------- */

function counterScore(team: Hero[], enemies: Hero[]): number {
  if (enemies.length === 0) {
    return 0;
  }

  const perEnemy = enemies.map((enemy) => {
    const scores = team
      .map((hero) => pairScore(hero, enemy))
      .sort((a, b) => b - a);

    return (scores[0] ?? 0) + (scores[1] ?? 0) * 0.45;
  });

  return perEnemy.reduce((a, b) => a + b, 0);
}

/* -----------------------------------------------------------
 * ANALYSE D'ÉQUIPE
 * --------------------------------------------------------- */

function matchupTeamScore(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
): number {
  if (RECOMMENDATION_CONFIG.matchup <= 0 || combats.length === 0) {
    return 0;
  }

  let score = 0;

  for (const hero of team) {
    const matchup = getHeroFourHeroMatchupScore(hero.id, combats, enemyIds, 2);

    if (!matchup) {
      continue;
    }

    const normalized =
      (matchup.smoothedWinRate / 100 - RECOMMENDATION_CONFIG.priorRate) * 20;

    score += normalized;
  }

  return score;
}

function analyzeTeam(
  team: Hero[],
  enemies: Hero[],
  enemyIds: string[],
  combats: Combat[]
): TeamAnalysis {
  const counter = counterScore(team, enemies);

  const teamHistory = teamHistoryScore(team, enemyIds, combats);

  const history = teamHistory + exactTeamHistoryScore(team, enemyIds, combats);

  const synergy = synergyScore(team, enemies);

  const role = roleBalance(team);

  const matchup = matchupTeamScore(team, enemyIds, combats);

  const coverage = enemies.filter((enemy) =>
    team.some((hero) => pairScore(hero, enemy) > 0)
  ).length;

  return {
    score: calculateRecommendationScore(
      {
        counterScore: counter,
        historyScore: history,
        synergyScore: synergy,
        roleScore: role,
        matchupScore: matchup,
        teamHistoryScore: teamHistory,
      },
      {
        counter: RECOMMENDATION_CONFIG.counter,
        history: RECOMMENDATION_CONFIG.history,
        synergy: RECOMMENDATION_CONFIG.synergy,
        role: RECOMMENDATION_CONFIG.role,
        matchup: RECOMMENDATION_CONFIG.matchup,
        teamHistory: RECOMMENDATION_CONFIG.teamHistory,
      }
    ).total,

    counterScore: counter,
    historyScore: history,
    synergyScore: synergy,
    roleScore: role,
    matchupScore: matchup,
    coverage,
  };
}

/* -----------------------------------------------------------
 * CANDIDATS
 * --------------------------------------------------------- */

function buildCandidates(enemyIds: string[], combats: Combat[]) {
  const enemies = getEnemies(enemyIds);

  const pool = HEROES;

  const counters = buildHeroCounters(enemies);

  const scored = pool.map((hero) => {
    const targets = counters.get(hero.id) ?? [];

    const counter = targets.reduce((sum, t) => sum + t.score, 0);

    const hist = historyStats(hero.id, enemyIds, combats);

    const reliability = Math.min(1, hist.games / 2);

    const history = (hist.rate - PRIOR_RATE) * 12 * reliability;

    const exactHistory =
      hist.exactRate !== null ? (hist.exactRate - PRIOR_RATE) * 8 : 0;

    const learnedBonus = heroHistoryBonus(hero.id, enemyIds, combats);

    return {
      hero,
      targets,
      seedScore: counter * 3 + history + exactHistory + learnedBonus,
    };
  });

  return scored.sort((a, b) => b.seedScore - a.seedScore);
}

/* -----------------------------------------------------------
 * RECOMMANDATION PRINCIPALE
 * --------------------------------------------------------- */

export function recommendTeam(
  enemyIds: string[],
  combats: Combat[] = []
): Hero[] {
  const enemies = getEnemies(enemyIds);

  if (enemies.length === 0) {
    return [];
  }

  /*
   * Les combats explicitement "removed" sont ignorés.
   *
   * Les anciennes lignes qui n'ont pas de status
   * restent utilisables.
   */
  const activeCombats = getActiveCombats(combats);

  /* ---------------------------------------------------------
   * PRIORITÉ ABSOLUE À UNE ÉQUIPE EXACTE HISTORIQUE GAGNANTE
   * --------------------------------------------------------- */

  /*
   * C'est volontairement AVANT le Beam Search.
   *
   * Le Beam Search peut éliminer un héros individuel
   * pourtant indispensable à une équipe historique gagnante.
   *
   * Exemple :
   *
   * Tracker
   * Snow Queen
   * Rose Knight
   * Lore Weaver
   * Black Crow
   *
   * Si cette équipe existe réellement dans l'historique
   * contre exactement les mêmes 5 ennemis et possède
   * au moins une victoire, on la conserve telle quelle.
   */
  const exactHistoricalTeam = getBestExactHistoricalTeam(
    enemyIds,
    activeCombats
  );

  if (exactHistoricalTeam) {
    return exactHistoricalTeam;
  }

  /*
   * 40 candidats pour le moteur théorique.
   */
  const candidates = buildCandidates(enemyIds, activeCombats).slice(0, 40);

  type State = {
    team: Hero[];
    score: number;
  };

  let states: State[] = [
    {
      team: [],
      score: 0,
    },
  ];

  /* ---------------------------------------------------------
   * BEAM SEARCH
   * --------------------------------------------------------- */

  for (let depth = 0; depth < TEAM_SIZE; depth++) {
    const next: State[] = [];

    for (const state of states) {
      for (const candidate of candidates) {
        if (state.team.some((h) => h.id === candidate.hero.id)) {
          continue;
        }

        const team = [...state.team, candidate.hero];

        const partialCounter = counterScore(team, enemies);

        const partialSynergy = synergyScore(team, enemies);

        const partialRole = roleBalance(team);

        next.push({
          team,
          score:
            partialCounter * COUNTER_WEIGHT +
            partialSynergy * SYNERGY_WEIGHT +
            partialRole * ROLE_WEIGHT +
            candidate.seedScore,
        });
      }
    }

    next.sort((a, b) => b.score - a.score);

    const seen = new Set<string>();

    states = [];

    for (const state of next) {
      const key = teamKey(state.team.map((h) => h.id));

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      states.push(state);

      if (states.length >= BEAM_WIDTH) {
        break;
      }
    }
  }

  /* ---------------------------------------------------------
   * ÉVALUATION FINALE
   * --------------------------------------------------------- */

  const validStates = states.filter(
    (state) => !shouldAvoidExactTeam(state.team, enemyIds, activeCombats)
  );

  const statesToEvaluate = validStates.length > 0 ? validStates : states;

  let best: Hero[] =
    statesToEvaluate[0]?.team ??
    candidates.slice(0, TEAM_SIZE).map((x) => x.hero);

  let bestScore = -Infinity;

  for (const state of statesToEvaluate) {
    const avoid = shouldAvoidExactTeam(state.team, enemyIds, activeCombats);

    if (avoid && validStates.length > 0) {
      continue;
    }

    const analysis = analyzeTeam(state.team, enemies, enemyIds, activeCombats);

    if (analysis.score > bestScore) {
      bestScore = analysis.score;
      best = state.team;
    }
  }

  return best.slice(0, TEAM_SIZE);
}

/* -----------------------------------------------------------
 * ÉQUIPE ALTERNATIVE ÉQUILIBRÉE
 * --------------------------------------------------------- */

export function balancedTeam(
  enemyIds: string[],
  combats: Combat[] = []
): Hero[] {
  const enemies = getEnemies(enemyIds);

  if (enemies.length === 0) {
    return [];
  }

  const activeCombats = getActiveCombats(combats);

  const enemySet = new Set(enemyIds);

  const pool = HEROES.filter((h) => !enemySet.has(h.id));

  const ranked = pool
    .map((hero) => {
      const counter = enemies.reduce(
        (sum, enemy) => sum + pairScore(hero, enemy),
        0
      );

      const hist = historyStats(hero.id, enemyIds, activeCombats);

      const history =
        (smoothedRate(hist.rate * hist.games, hist.games) - PRIOR_RATE) * 8;

      const learnedBonus = heroHistoryBonus(hero.id, enemyIds, activeCombats);

      return {
        hero,
        score: counter * 4 + history + learnedBonus,
      };
    })
    .sort((a, b) => b.score - a.score);

  const team: Hero[] = [];

  const pickRole = (role: HeroRole) => {
    const candidate = ranked.find(
      (x) => heroRole(x.hero) === role && !team.some((h) => h.id === x.hero.id)
    );

    if (candidate) {
      team.push(candidate.hero);
    }
  };

  pickRole("Tank");
  pickRole("Support");

  while (team.length < TEAM_SIZE) {
    const candidate = ranked.find((x) => !team.some((h) => h.id === x.hero.id));

    if (!candidate) {
      break;
    }

    team.push(candidate.hero);
  }

  return team.slice(0, TEAM_SIZE);
}

/* -----------------------------------------------------------
 * RAPPORT DE COUVERTURE
 * --------------------------------------------------------- */

export function coverageReport(
  team: Hero[],
  enemyIds: string[]
): CounterPick[] {
  const enemies = getEnemies(enemyIds);

  return team.map((hero) => {
    const targets = enemies
      .map((enemy) => scorePair(hero, enemy))
      .filter((t) => t.score > 0);

    return {
      hero,
      score: targets.reduce((sum, t) => sum + t.score, 0),
      targets,
    };
  });
}

/* -----------------------------------------------------------
 * ANALYSE EXTERNE
 * --------------------------------------------------------- */

export function analyzeRecommendedTeam(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[] = []
): TeamAnalysis {
  const activeCombats = getActiveCombats(combats);

  return analyzeTeam(team, getEnemies(enemyIds), enemyIds, activeCombats);
}
