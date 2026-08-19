
import {
  Hero,
  HEROES,
  CLASS_BEATS,
  heroRole,
  HeroRole,
} from "./heroes";
import type { Combat } from "./storage";

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
  coverage: number;
}

const TEAM_SIZE = 5;
const BEAM_WIDTH = 180;

/*
 * Poids généraux du moteur.
 */
const COUNTER_WEIGHT = 5;
const HISTORY_WEIGHT = 7;
const SYNERGY_WEIGHT = 2;
const ROLE_WEIGHT = 1;

/*
 * Prior historique.
 */
const PRIOR_RATE = 0.419;
const PRIOR_GAMES = 3;

/*
 * Une équipe exacte qui a déjà perdu plusieurs fois
 * sans aucune victoire contre exactement la même
 * composition ennemie ne doit pas être reproposée.
 *
 * IMPORTANT :
 * Cela ne désactive PAS les héros.
 * Cela ne supprime PAS les combats.
 * Cela concerne uniquement la recommandation
 * automatique de cette composition exacte.
 */
const MIN_EXACT_LOSSES_TO_AVOID = 2;

/* -----------------------------------------------------------
 * CONTRES THÉORIQUES
 * --------------------------------------------------------- */

function scorePair(
  c: Hero,
  e: Hero
): CounterTarget {
  const cls =
    CLASS_BEATS[c.cls] === e.cls;

  return {
    id: e.id,
    score: cls ? 1 : 0,
    cls,
  };
}

function getEnemies(
  enemyIds: string[]
): Hero[] {
  const set =
    new Set(enemyIds);

  return HEROES.filter((h) =>
    set.has(h.id)
  );
}

function pairScore(
  c: Hero,
  e: Hero
): number {
  const cls =
    CLASS_BEATS[c.cls] === e.cls;

  return cls ? 1 : 0;
}

function buildHeroCounters(
  enemies: Hero[]
) {
  return new Map(
    HEROES.map((hero) => [
      hero.id,
      enemies.map((enemy) =>
        scorePair(hero, enemy)
      ),
    ])
  );
}

/* -----------------------------------------------------------
 * HISTORIQUE INDIVIDUEL
 * --------------------------------------------------------- */

function historyStats(
  heroId: string,
  enemyIds: string[],
  combats: Combat[]
) {
  const enemySet =
    new Set(enemyIds);

  let weightedWins = 0;
  let weightedGames = 0;

  let exactWins = 0;
  let exactGames = 0;

  for (const combat of combats) {
    if (
      !combat.my_heroes.includes(
        heroId
      )
    ) {
      continue;
    }

    const overlap =
      combat.enemy_heroes.filter(
        (id) =>
          enemySet.has(id)
      ).length;

    if (overlap === 0) {
      continue;
    }

    const weight =
      overlap /
      enemyIds.length;

    weightedGames += weight;

    if (combat.won) {
      weightedWins += weight;
    }

    if (
      overlap ===
      enemyIds.length
    ) {
      exactGames++;

      if (combat.won) {
        exactWins++;
      }
    }
  }

  return {
    rate:
      weightedGames > 0
        ? weightedWins /
          weightedGames
        : PRIOR_RATE,

    games: weightedGames,

    exactRate:
      exactGames > 0
        ? exactWins /
          exactGames
        : null,

    exactGames,
    exactWins,
  };
}

function smoothedRate(
  wins: number,
  games: number,
  prior = PRIOR_RATE
): number {
  return (
    (wins +
      prior *
        PRIOR_GAMES) /
    (games +
      PRIOR_GAMES)
  );
}

/* -----------------------------------------------------------
 * HISTORIQUE EXACT D'UNE ÉQUIPE
 * --------------------------------------------------------- */

function getExactTeamRecord(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
) {
  const teamKey =
    team
      .map((h) => h.id)
      .sort()
      .join(",");

  const enemyKey =
    [...enemyIds]
      .sort()
      .join(",");

  let wins = 0;
  let losses = 0;

  for (const combat of combats) {
    const combatTeamKey =
      [...combat.my_heroes]
        .sort()
        .join(",");

    if (
      combatTeamKey !==
      teamKey
    ) {
      continue;
    }

    const combatEnemyKey =
      [...combat.enemy_heroes]
        .sort()
        .join(",");

    if (
      combatEnemyKey !==
      enemyKey
    ) {
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
    games:
      wins + losses,
  };
}

/*
 * Équipe à éviter automatiquement.
 *
 * Exemple :
 *
 *   0 victoire / 3 défaites
 *
 * => cette composition exacte ne sera plus choisie
 * automatiquement.
 *
 * En revanche :
 *
 *   1 victoire / 3 défaites
 *
 * reste disponible, car elle a au moins démontré
 * qu'elle pouvait gagner.
 */
function shouldAvoidExactTeam(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
): boolean {
  const record =
    getExactTeamRecord(
      team,
      enemyIds,
      combats
    );

  return (
    record.wins === 0 &&
    record.losses >=
      MIN_EXACT_LOSSES_TO_AVOID
  );
}

/* -----------------------------------------------------------
 * HISTORIQUE D'UNE ÉQUIPE
 * --------------------------------------------------------- */

function teamHistoryScore(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
): number {
  if (combats.length === 0) {
    return 0;
  }

  const enemySet =
    new Set(enemyIds);

  const teamIds =
    new Set(
      team.map((h) => h.id)
    );

  let weighted = 0;
  let totalWeight = 0;

  for (const combat of combats) {
    const enemyOverlap =
      combat.enemy_heroes.filter(
        (id) =>
          enemySet.has(id)
      ).length;

    if (enemyOverlap < 2) {
      continue;
    }

    const myOverlap =
      combat.my_heroes.filter(
        (id) =>
          teamIds.has(id)
      ).length;

    if (myOverlap < 2) {
      continue;
    }

    const enemyWeight =
      enemyOverlap /
      enemyIds.length;

    const teamWeight =
      myOverlap /
      TEAM_SIZE;

    const weight =
      enemyWeight *
      teamWeight;

    totalWeight += weight;

    if (combat.won) {
      weighted += weight;
    }
  }

  if (totalWeight === 0) {
    return 0;
  }

  const observed =
    weighted /
    totalWeight;

  const rate =
    smoothedRate(
      observed *
        totalWeight,
      totalWeight
    );

  return (
    rate -
    PRIOR_RATE
  ) * 20;
}

/* -----------------------------------------------------------
 * HISTORIQUE EXACT
 * --------------------------------------------------------- */

function exactTeamHistoryScore(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
): number {
  const record =
    getExactTeamRecord(
      team,
      enemyIds,
      combats
    );

  const {
    wins,
    losses,
    games,
  } = record;

  if (games === 0) {
    return 0;
  }

  /*
   * Une équipe qui a 0 victoire et plusieurs
   * défaites reçoit un score fortement négatif.
   *
   * Le filtre final l'empêchera également
   * d'être choisie automatiquement.
   */
  if (
    wins === 0 &&
    losses >=
      MIN_EXACT_LOSSES_TO_AVOID
  ) {
    return -1000;
  }

  const rate =
    smoothedRate(
      wins,
      games
    );

  const confidence =
    Math.min(
      2.5,
      Math.sqrt(games)
    );

  return (
    (rate -
      PRIOR_RATE) *
    55 *
    confidence
  );
}

/* -----------------------------------------------------------
 * BONUS POUR LES HÉROS D'UNE VICTOIRE
 * --------------------------------------------------------- */

function heroHistoryBonus(
  heroId: string,
  enemyIds: string[],
  combats: Combat[]
): number {
  const enemySet =
    new Set(enemyIds);

  let score = 0;

  for (const combat of combats) {
    if (
      !combat.my_heroes.includes(
        heroId
      )
    ) {
      continue;
    }

    const overlap =
      combat.enemy_heroes.filter(
        (id) =>
          enemySet.has(id)
      ).length;

    if (overlap < 3) {
      continue;
    }

    const enemyWeight =
      overlap /
      enemyIds.length;

    if (combat.won) {
      score +=
        enemyWeight * 8;
    } else {
      score -=
        enemyWeight * 3;
    }
  }

  return score;
}

/* -----------------------------------------------------------
 * ÉQUILIBRE DES RÔLES
 * --------------------------------------------------------- */

function roleBalance(
  team: Hero[]
): number {
  const roles =
    new Map<
      HeroRole,
      number
    >();

  for (const hero of team) {
    const role =
      heroRole(hero);

    roles.set(
      role,
      (roles.get(role) ?? 0) +
        1
    );
  }

  let score = 0;

  if (
    (roles.get("Tank") ?? 0) >=
    1
  ) {
    score += 2;
  }

  if (
    (roles.get("Support") ?? 0) >=
    1
  ) {
    score += 2;
  }

  if (
    (roles.get("Damage") ?? 0) >=
    2
  ) {
    score += 2;
  }

  if (
    new Set(
      team.map(
        (h) => h.cls
      )
    ).size >= 2
  ) {
    score += 1;
  }

  return score;
}

/* -----------------------------------------------------------
 * SYNERGIE
 * --------------------------------------------------------- */

function synergyScore(
  team: Hero[],
  enemies: Hero[]
): number {
  let score = 0;

  for (
    let i = 0;
    i < team.length;
    i++
  ) {
    for (
      let j = i + 1;
      j < team.length;
      j++
    ) {
      if (
        team[i].cls !==
        team[j].cls
      ) {
        score += 0.25;
      }
    }
  }

  const covered =
    new Set<string>();

  for (const hero of team) {
    for (const enemy of enemies) {
      if (
        pairScore(
          hero,
          enemy
        ) > 0
      ) {
        covered.add(
          enemy.id
        );
      }
    }
  }

  score +=
    covered.size *
    0.35;

  return score;
}

/* -----------------------------------------------------------
 * SCORE DE CONTRE
 * --------------------------------------------------------- */

function counterScore(
  team: Hero[],
  enemies: Hero[]
): number {
  if (enemies.length === 0) {
    return 0;
  }

  const perEnemy =
    enemies.map((enemy) => {
      const scores =
        team
          .map((hero) =>
            pairScore(
              hero,
              enemy
            )
          )
          .sort(
            (a, b) =>
              b - a
          );

      return (
        (scores[0] ?? 0) +
        (scores[1] ?? 0) *
          0.45
      );
    });

  return perEnemy.reduce(
    (a, b) =>
      a + b,
    0
  );
}

/* -----------------------------------------------------------
 * ANALYSE D'ÉQUIPE
 * --------------------------------------------------------- */

function analyzeTeam(
  team: Hero[],
  enemies: Hero[],
  enemyIds: string[],
  combats: Combat[]
): TeamAnalysis {
  const counter =
    counterScore(
      team,
      enemies
    );

  const history =
    teamHistoryScore(
      team,
      enemyIds,
      combats
    ) +
    exactTeamHistoryScore(
      team,
      enemyIds,
      combats
    );

  const synergy =
    synergyScore(
      team,
      enemies
    );

  const role =
    roleBalance(team);

  const coverage =
    enemies.filter(
      (enemy) =>
        team.some(
          (hero) =>
            pairScore(
              hero,
              enemy
            ) > 0
        )
    ).length;

  return {
    score:
      counter *
        COUNTER_WEIGHT +
      history *
        HISTORY_WEIGHT +
      synergy *
        SYNERGY_WEIGHT +
      role *
        ROLE_WEIGHT,

    counterScore:
      counter,

    historyScore:
      history,

    synergyScore:
      synergy,

    roleScore:
      role,

    coverage,
  };
}

/* -----------------------------------------------------------
 * CANDIDATS
 * --------------------------------------------------------- */

function buildCandidates(
  enemyIds: string[],
  combats: Combat[]
) {
  const enemies =
    getEnemies(enemyIds);

  const enemySet =
    new Set(enemyIds);

  const pool =
    HEROES.filter(
      (h) =>
        !enemySet.has(h.id)
    );

  const counters =
    buildHeroCounters(
      enemies
    );

  const scored =
    pool.map((hero) => {
      const targets =
        counters.get(
          hero.id
        ) ?? [];

      const counter =
        targets.reduce(
          (sum, t) =>
            sum + t.score,
          0
        );

      const hist =
        historyStats(
          hero.id,
          enemyIds,
          combats
        );

      const reliability =
        Math.min(
          1,
          hist.games / 2
        );

      const history =
        (
          (hist.rate -
            PRIOR_RATE) *
          12
        ) *
        reliability;

      const exactHistory =
        hist.exactRate !== null
          ? (
              hist.exactRate -
              PRIOR_RATE
            ) * 8
          : 0;

      const learnedBonus =
        heroHistoryBonus(
          hero.id,
          enemyIds,
          combats
        );

      return {
        hero,
        targets,

        seedScore:
          counter * 3 +
          history +
          exactHistory +
          learnedBonus,
      };
    });

  return scored.sort(
    (a, b) =>
      b.seedScore -
      a.seedScore
  );
}

/* -----------------------------------------------------------
 * RECOMMANDATION PRINCIPALE
 * --------------------------------------------------------- */

export function recommendTeam(
  enemyIds: string[],
  combats: Combat[] = []
): Hero[] {
  const enemies =
    getEnemies(enemyIds);

  if (enemies.length === 0) {
    return [];
  }

  /*
   * 40 candidats.
   */
  const candidates =
    buildCandidates(
      enemyIds,
      combats
    ).slice(0, 40);

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

  for (
    let depth = 0;
    depth < TEAM_SIZE;
    depth++
  ) {
    const next: State[] = [];

    for (const state of states) {
      for (const candidate of candidates) {
        if (
          state.team.some(
            (h) =>
              h.id ===
              candidate.hero.id
          )
        ) {
          continue;
        }

        const team = [
          ...state.team,
          candidate.hero,
        ];

        const partialCounter =
          counterScore(
            team,
            enemies
          );

        const partialSynergy =
          synergyScore(
            team,
            enemies
          );

        const partialRole =
          roleBalance(team);

        next.push({
          team,

          score:
            partialCounter *
              COUNTER_WEIGHT +
            partialSynergy *
              SYNERGY_WEIGHT +
            partialRole *
              ROLE_WEIGHT +
            candidate.seedScore,
        });
      }
    }

    next.sort(
      (a, b) =>
        b.score -
        a.score
    );

    const seen =
      new Set<string>();

    states = [];

    for (const state of next) {
      const key =
        state.team
          .map(
            (h) => h.id
          )
          .sort()
          .join(",");

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      states.push(state);

      if (
        states.length >=
        BEAM_WIDTH
      ) {
        break;
      }
    }
  }

  /* ---------------------------------------------------------
   * ÉVALUATION FINALE
   * --------------------------------------------------------- */

  /*
   * On cherche d'abord parmi les équipes
   * qui ne sont PAS des équipes déjà perdues
   * plusieurs fois sans victoire.
   */
  const validStates =
    states.filter(
      (state) =>
        !shouldAvoidExactTeam(
          state.team,
          enemyIds,
          combats
        )
    );

  /*
   * Si on possède au moins une équipe valide,
   * elle devient notre espace de recherche.
   *
   * Cela évite précisément de reproposer :
   *
   *   même équipe
   *   0 victoire
   *   3 défaites
   */
  const statesToEvaluate =
    validStates.length > 0
      ? validStates
      : states;

  let best: Hero[] =
    statesToEvaluate[0]?.team ??
    candidates
      .slice(
        0,
        TEAM_SIZE
      )
      .map(
        (x) => x.hero
      );

  let bestScore =
    -Infinity;

  for (
    const state of statesToEvaluate
  ) {
    /*
     * Protection supplémentaire :
     * même si une équipe perdante
     * arrive ici en fallback, elle
     * ne peut pas gagner contre une
     * équipe valide simplement grâce
     * au score historique.
     */
    const avoid =
      shouldAvoidExactTeam(
        state.team,
        enemyIds,
        combats
      );

    if (
      avoid &&
      validStates.length > 0
    ) {
      continue;
    }

    const analysis =
      analyzeTeam(
        state.team,
        enemies,
        enemyIds,
        combats
      );

    if (
      analysis.score >
      bestScore
    ) {
      bestScore =
        analysis.score;

      best =
        state.team;
    }
  }

  return best.slice(
    0,
    TEAM_SIZE
  );
}

/* -----------------------------------------------------------
 * ÉQUIPE ALTERNATIVE ÉQUILIBRÉE
 * --------------------------------------------------------- */

export function balancedTeam(
  enemyIds: string[],
  combats: Combat[] = []
): Hero[] {
  const enemies =
    getEnemies(enemyIds);

  if (enemies.length === 0) {
    return [];
  }

  const enemySet =
    new Set(enemyIds);

  const pool =
    HEROES.filter(
      (h) =>
        !enemySet.has(h.id)
    );

  const ranked =
    pool
      .map((hero) => {
        const counter =
          enemies.reduce(
            (sum, enemy) =>
              sum +
              pairScore(
                hero,
                enemy
              ),
            0
          );

        const hist =
          historyStats(
            hero.id,
            enemyIds,
            combats
          );

        const history =
          (
            smoothedRate(
              hist.rate *
                hist.games,
              hist.games
            ) -
            PRIOR_RATE
          ) * 8;

        const learnedBonus =
          heroHistoryBonus(
            hero.id,
            enemyIds,
            combats
          );

        return {
          hero,

          score:
            counter * 4 +
            history +
            learnedBonus,
        };
      })
      .sort(
        (a, b) =>
          b.score -
          a.score
      );

  const team: Hero[] = [];

  const pickRole = (
    role: HeroRole
  ) => {
    const candidate =
      ranked.find(
        (x) =>
          heroRole(
            x.hero
          ) === role &&
          !team.some(
            (h) =>
              h.id ===
              x.hero.id
          )
      );

    if (candidate) {
      team.push(
        candidate.hero
      );
    }
  };

  pickRole("Tank");
  pickRole("Support");

  while (
    team.length <
    TEAM_SIZE
  ) {
    const candidate =
      ranked.find(
        (x) =>
          !team.some(
            (h) =>
              h.id ===
              x.hero.id
          )
      );

    if (!candidate) {
      break;
    }

    team.push(
      candidate.hero
    );
  }

  return team.slice(
    0,
    TEAM_SIZE
  );
}

/* -----------------------------------------------------------
 * RAPPORT DE COUVERTURE
 * --------------------------------------------------------- */

export function coverageReport(
  team: Hero[],
  enemyIds: string[]
): CounterPick[] {
  const enemies =
    getEnemies(enemyIds);

  return team.map((hero) => {
    const targets =
      enemies
        .map((enemy) =>
          scorePair(
            hero,
            enemy
          )
        )
        .filter(
          (t) =>
            t.score > 0
        );

    return {
      hero,

      score:
        targets.reduce(
          (sum, t) =>
            sum + t.score,
          0
        ),

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
  return analyzeTeam(
    team,
    getEnemies(enemyIds),
    enemyIds,
    combats
  );
}

