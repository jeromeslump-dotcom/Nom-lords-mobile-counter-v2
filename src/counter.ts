import {
  Hero,
  HEROES,
  TYPE_BEATS,
  CLASS_BEATS,
  heroRole,
  HeroRole,
} from "./heroes";
import type { Combat } from "./storage";

export interface CounterTarget {
  id: string;
  score: number;
  type: boolean;
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
 * Poids gÃ©nÃ©raux du moteur.
 *
 * L'idÃ©e est de conserver les contres thÃ©oriques comme base,
 * mais de donner beaucoup plus d'importance aux rÃ©sultats rÃ©els
 * lorsqu'un historique pertinent existe.
 */
const COUNTER_WEIGHT = 5;
const HISTORY_WEIGHT = 7;
const SYNERGY_WEIGHT = 2;
const ROLE_WEIGHT = 1;

/*
 * Prior historique.
 *
 * Il sert uniquement Ã  Ã©viter qu'un seul combat transforme
 * immÃ©diatement une statistique en 0 % ou 100 %.
 *
 * Il est volontairement plus faible qu'avant afin que les
 * victoires rÃ©elles aient davantage d'influence.
 */
const PRIOR_RATE = 0.419;
const PRIOR_GAMES = 3;

/* -----------------------------------------------------------
 * CONTRES THÃ‰ORIQUES
 * --------------------------------------------------------- */

function scorePair(c: Hero, e: Hero): CounterTarget {
  const type = TYPE_BEATS[c.type] === e.type;
  const cls = CLASS_BEATS[c.cls] === e.cls;

  return {
    id: e.id,
    score: (type ? 2 : 0) + (cls ? 1 : 0),
    type,
    cls,
  };
}

function getEnemies(enemyIds: string[]): Hero[] {
  const set = new Set(enemyIds);
  return HEROES.filter((h) => set.has(h.id));
}

function pairScore(c: Hero, e: Hero): number {
  const type = TYPE_BEATS[c.type] === e.type;
  const cls = CLASS_BEATS[c.cls] === e.cls;

  return (type ? 2 : 0) + (cls ? 1 : 0);
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

/*
 * Analyse les combats dans lesquels un hÃ©ros a participÃ©.
 *
 * Un combat contre 5/5 ennemis identiques compte davantage
 * qu'un combat contre seulement 2/5.
 */
function historyStats(
  heroId: string,
  enemyIds: string[],
  combats: Combat[]
) {
  const enemySet = new Set(enemyIds);

  let weightedWins = 0;
  let weightedGames = 0;

  let exactWins = 0;
  let exactGames = 0;

  for (const combat of combats) {
    if (!combat.my_heroes.includes(heroId)) continue;

    const overlap = combat.enemy_heroes.filter((id) =>
      enemySet.has(id)
    ).length;

    if (overlap === 0) continue;

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
    rate:
      weightedGames > 0
        ? weightedWins / weightedGames
        : PRIOR_RATE,

    games: weightedGames,

    exactRate:
      exactGames > 0
        ? exactWins / exactGames
        : null,

    exactGames,
    exactWins,
  };
}

/*
 * Lissage lÃ©ger.
 *
 * Il Ã©vite qu'une seule dÃ©faite ou victoire donne immÃ©diatement
 * une certitude absolue.
 */
function smoothedRate(
  wins: number,
  games: number,
  prior = PRIOR_RATE
): number {
  return (
    (wins + prior * PRIOR_GAMES) /
    (games + PRIOR_GAMES)
  );
}

/* -----------------------------------------------------------
 * HISTORIQUE D'UNE Ã‰QUIPE
 * --------------------------------------------------------- */

/*
 * Mesure les rÃ©sultats d'une Ã©quipe qui ressemble Ã  l'Ã©quipe
 * actuelle contre une composition ennemie similaire.
 *
 * Plus il y a de hÃ©ros communs cÃ´tÃ© ennemi ET cÃ´tÃ© joueur,
 * plus le combat est pertinent.
 */
function teamHistoryScore(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
): number {
  if (combats.length === 0) return 0;

  const enemySet = new Set(enemyIds);
  const teamIds = new Set(team.map((h) => h.id));

  let weighted = 0;
  let totalWeight = 0;

  for (const combat of combats) {
    const enemyOverlap = combat.enemy_heroes.filter((id) =>
      enemySet.has(id)
    ).length;

    if (enemyOverlap < 2) continue;

    const myOverlap = combat.my_heroes.filter((id) =>
      teamIds.has(id)
    ).length;

    if (myOverlap < 2) continue;

    const enemyWeight = enemyOverlap / enemyIds.length;
    const teamWeight = myOverlap / TEAM_SIZE;

    const weight = enemyWeight * teamWeight;

    totalWeight += weight;

    if (combat.won) {
      weighted += weight;
    }
  }

  if (totalWeight === 0) return 0;

  const observed = weighted / totalWeight;

  const rate = smoothedRate(
    observed * totalWeight,
    totalWeight
  );

  /*
   * On centre le score autour du taux global.
   *
   * Une Ã©quipe qui fait mieux que le taux de rÃ©fÃ©rence
   * reÃ§oit un bonus.
   */
  return (rate - PRIOR_RATE) * 20;
}

/* -----------------------------------------------------------
 * HISTORIQUE EXACT
 * --------------------------------------------------------- */

/*
 * C'est la partie la plus importante.

 * Si exactement les mÃªmes 5 hÃ©ros ont dÃ©jÃ  Ã©tÃ© utilisÃ©s
 * contre exactement les mÃªmes 5 ennemis, on donne un poids
 * important au rÃ©sultat rÃ©el.
 */
function exactTeamHistoryScore(
  team: Hero[],
  enemyIds: string[],
  combats: Combat[]
): number {
  const teamKey = team
    .map((h) => h.id)
    .sort()
    .join(",");

  const enemyKey = [...enemyIds]
    .sort()
    .join(",");

  let wins = 0;
  let losses = 0;

  for (const combat of combats) {
    const combatTeamKey = [...combat.my_heroes]
      .sort()
      .join(",");

    if (combatTeamKey !== teamKey) continue;

    const combatEnemyKey = [...combat.enemy_heroes]
      .sort()
      .join(",");

    if (combatEnemyKey !== enemyKey) continue;

    if (combat.won) {
      wins++;
    } else {
      losses++;
    }
  }

  const games = wins + losses;

  if (games === 0) return 0;

  const rate = smoothedRate(wins, games);

  /*
   * Bonus/malus supplÃ©mentaire selon le nombre de parties.
   *
   * Une seule victoire donne dÃ©jÃ  un bonus visible.
   * Plusieurs victoires renforcent progressivement ce bonus.
   */
  const confidence = Math.min(2.5, Math.sqrt(games));

  return (rate - PRIOR_RATE) * 55 * confidence;
}

/* -----------------------------------------------------------
 * BONUS POUR LES HÃ‰ROS D'UNE VICTOIRE
 * --------------------------------------------------------- */

/*
 * Un hÃ©ros qui faisait partie d'une victoire contre cette
 * composition doit rester compÃ©titif dans la recherche.
 *
 * Cela Ã©vite qu'il soit Ã©liminÃ© trop tÃ´t par le classement
 * thÃ©orique des contres.
 */
function heroHistoryBonus(
  heroId: string,
  enemyIds: string[],
  combats: Combat[]
): number {
  const enemySet = new Set(enemyIds);

  let score = 0;

  for (const combat of combats) {
    if (!combat.my_heroes.includes(heroId)) continue;

    const overlap = combat.enemy_heroes.filter((id) =>
      enemySet.has(id)
    ).length;

    if (overlap < 3) continue;

    const enemyWeight = overlap / enemyIds.length;

    if (combat.won) {
      /*
       * Victoire :
       * 3/5 = bonus modÃ©rÃ©
       * 4/5 = bonus important
       * 5/5 = bonus trÃ¨s important
       */
      score += enemyWeight * 8;
    } else {
      /*
       * Une dÃ©faite retire un peu de confiance,
       * sans Ã©liminer complÃ¨tement le hÃ©ros.
       */
      score -= enemyWeight * 3;
    }
  }

  return score;
}

/* -----------------------------------------------------------
 * Ã‰QUILIBRE DES RÃ”LES
 * --------------------------------------------------------- */

function roleBalance(team: Hero[]): number {
  const roles = new Map<HeroRole, number>();

  for (const hero of team) {
    roles.set(
      heroRole(hero),
      (roles.get(heroRole(hero)) ?? 0) + 1
    );
  }

  let score = 0;

  if ((roles.get("Tank") ?? 0) >= 1) score += 2;
  if ((roles.get("Support") ?? 0) >= 1) score += 2;
  if ((roles.get("Damage") ?? 0) >= 2) score += 2;

  if (
    team.filter(
      (h) => h.type === "Infantry"
    ).length <= 2
  ) {
    score += 1;
  }

  if (
    new Set(team.map((h) => h.cls)).size >= 2
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

  for (let i = 0; i < team.length; i++) {
    for (let j = i + 1; j < team.length; j++) {
      if (team[i].cls !== team[j].cls) {
        score += 0.25;
      }

      if (team[i].type !== team[j].type) {
        score += 0.15;
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

function counterScore(
  team: Hero[],
  enemies: Hero[]
): number {
  if (enemies.length === 0) return 0;

  const perEnemy = enemies.map((enemy) => {
    const scores = team
      .map((hero) => pairScore(hero, enemy))
      .sort((a, b) => b - a);

    return (
      (scores[0] ?? 0) +
      (scores[1] ?? 0) * 0.45
    );
  });

  return perEnemy.reduce(
    (a, b) => a + b,
    0
  );
}

/* -----------------------------------------------------------
 * ANALYSE D'Ã‰QUIPE
 * --------------------------------------------------------- */

function analyzeTeam(
  team: Hero[],
  enemies: Hero[],
  enemyIds: string[],
  combats: Combat[]
): TeamAnalysis {
  const counter = counterScore(team, enemies);

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

  const synergy = synergyScore(
    team,
    enemies
  );

  const role = roleBalance(team);

  const coverage = enemies.filter((enemy) =>
    team.some(
      (hero) =>
        pairScore(hero, enemy) > 0
    )
  ).length;

  return {
    /*
     * Le score final mÃ©lange :
     *
     * 1. contre thÃ©orique
     * 2. historique rÃ©el
     * 3. synergie
     * 4. Ã©quilibre des rÃ´les
     */
    score:
      counter * COUNTER_WEIGHT +
      history * HISTORY_WEIGHT +
      synergy * SYNERGY_WEIGHT +
      role * ROLE_WEIGHT,

    counterScore: counter,
    historyScore: history,
    synergyScore: synergy,
    roleScore: role,
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
  const enemies = getEnemies(enemyIds);

  const enemySet = new Set(enemyIds);

  const pool = HEROES.filter(
    (h) => !enemySet.has(h.id)
  );

  const counters =
    buildHeroCounters(enemies);

  const scored = pool.map((hero) => {
    const targets =
      counters.get(hero.id) ?? [];

    const counter =
      targets.reduce(
        (sum, t) => sum + t.score,
        0
      );

    const hist =
      historyStats(
        hero.id,
        enemyIds,
        combats
      );

    const reliability = Math.min(
      1,
      hist.games / 2
    );

    const history =
      ((hist.rate - PRIOR_RATE) * 12) *
      reliability;

    const exactHistory =
      hist.exactRate !== null
        ? (hist.exactRate - PRIOR_RATE) * 8
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

  /*
   * IMPORTANT :
   *
   * On conserve davantage de candidats qu'avant.
   * Cela Ã©vite qu'un hÃ©ros historique soit Ã©liminÃ©
   * uniquement parce qu'il est moins bon sur le papier.
   */
  return scored.sort(
    (a, b) =>
      b.seedScore - a.seedScore
  );
}

/* -----------------------------------------------------------
 * RECOMMANDATION PRINCIPALE
 * --------------------------------------------------------- */

/**
 * V2 recommendation engine.
 *
 * Combine :
 * - contres thÃ©oriques
 * - historique des combats
 * - victoires exactes
 * - combats similaires
 * - synergie
 * - Ã©quilibre des rÃ´les
 */
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
   * On passe de 28 Ã  40 candidats.
   *
   * Cela donne davantage de chances aux hÃ©ros ayant
   * un historique positif mais un score thÃ©orique
   * lÃ©gÃ¨rement infÃ©rieur.
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
              h.id === candidate.hero.id
          )
        ) {
          continue;
        }

        const team = [
          ...state.team,
          candidate.hero,
        ];

        const partial =
          analyzeTeam(
            team,
            enemies,
            enemyIds,
            combats
          );

        next.push({
          team,
          score:
            partial.score +
            candidate.seedScore,
        });
      }
    }

    next.sort(
      (a, b) =>
        b.score - a.score
    );

    const seen =
      new Set<string>();

    states = [];

    for (const state of next) {
      const key = state.team
        .map((h) => h.id)
        .sort()
        .join(",");

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      states.push(state);

      if (
        states.length >= BEAM_WIDTH
      ) {
        break;
      }
    }
  }

  let best =
    states[0]?.team ??
    candidates
      .slice(0, TEAM_SIZE)
      .map((x) => x.hero);

  let bestScore = -Infinity;

  /*
   * DerniÃ¨re Ã©valuation complÃ¨te.
   *
   * C'est ici que l'historique exact peut rÃ©ellement
   * faire passer une Ã©quipe devant une Ã©quipe uniquement
   * thÃ©orique.
   */
  for (const state of states) {
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
 * Ã‰QUIPE ALTERNATIVE Ã‰QUILIBRÃ‰E
 * --------------------------------------------------------- */

/**
 * Returns a deliberately role-balanced alternative
 * to the main counter team.
 */
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

  const pool = HEROES.filter(
    (h) => !enemySet.has(h.id)
  );

  const ranked = pool
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
        (smoothedRate(
          hist.rate *
            hist.games,
          hist.games
        ) -
          PRIOR_RATE) *
        8;

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
        b.score - a.score
    );

  const team: Hero[] = [];

  const pickRole = (
    role: HeroRole
  ) => {
    const candidate =
      ranked.find(
        (x) =>
          heroRole(x.hero) ===
            role &&
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
    team.length < TEAM_SIZE
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
          (t) => t.score > 0
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
