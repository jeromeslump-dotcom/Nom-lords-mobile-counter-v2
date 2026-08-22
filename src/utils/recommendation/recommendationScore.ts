
export interface RecommendationScoreInput {
  counterScore: number;

  historyScore?: number;

  synergyScore?: number;

  roleScore?: number;

  matchupScore?: number;

  teamHistoryScore?: number;
}

export interface RecommendationScoreWeights {
  counter: number;
  history: number;
  synergy: number;
  role: number;
  matchup: number;
  teamHistory: number;
}

export interface RecommendationScoreResult {
  total: number;

  counterContribution: number;
  historyContribution: number;
  synergyContribution: number;
  roleContribution: number;
  matchupContribution: number;
  teamHistoryContribution: number;
}

/**
 * Calcule le score final d'une recommandation.
 *
 * Chaque source est multipliée par son poids.
 *
 * Exemple :
 *
 * counter = 100
 * weight counter = 5
 *
 * contribution = 500
 */
export function calculateRecommendationScore(
  input: RecommendationScoreInput,
  weights: RecommendationScoreWeights
): RecommendationScoreResult {
  const counterScore = Number.isFinite(input.counterScore)
    ? input.counterScore
    : 0;

  const historyScore = Number.isFinite(input.historyScore)
    ? input.historyScore ?? 0
    : 0;

  const synergyScore = Number.isFinite(input.synergyScore)
    ? input.synergyScore ?? 0
    : 0;

  const roleScore = Number.isFinite(input.roleScore)
    ? input.roleScore ?? 0
    : 0;

  const matchupScore = Number.isFinite(input.matchupScore)
    ? input.matchupScore ?? 0
    : 0;

  const teamHistoryScore = Number.isFinite(input.teamHistoryScore)
    ? input.teamHistoryScore ?? 0
    : 0;

  const counterContribution =
    counterScore * weights.counter;

  const historyContribution =
    historyScore * weights.history;

  const synergyContribution =
    synergyScore * weights.synergy;

  const roleContribution =
    roleScore * weights.role;

  const matchupContribution =
    matchupScore * weights.matchup;

  const teamHistoryContribution =
    teamHistoryScore * weights.teamHistory;

  const total =
    counterContribution +
    historyContribution +
    synergyContribution +
    roleContribution +
    matchupContribution +
    teamHistoryContribution;

  return {
    total,

    counterContribution,
    historyContribution,
    synergyContribution,
    roleContribution,
    matchupContribution,
    teamHistoryContribution,
  };
}

/**
 * Classe des scores du plus élevé au plus faible.
 *
 * En cas d'égalité, l'ordre original est conservé grâce au sort stable
 * des moteurs JavaScript modernes.
 */
export function sortRecommendationScores<
  T extends { score: number },
>(items: T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}

