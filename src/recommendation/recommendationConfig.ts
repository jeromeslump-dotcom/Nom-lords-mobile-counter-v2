export interface RecommendationConfig {
  counter: number;
  history: number;
  synergy: number;
  roles: number;
  prior: {
    rate: number;
    games: number;
  };
  matchup: {
    minSharedHeroes: number;
    weight: number;
  };
  teamHistory: {
    weight: number;
    minGames: number;
  };
}

export const RECOMMENDATION_CONFIG: RecommendationConfig = {
  counter: 5,
  history: 7,
  synergy: 2,
  roles: 1,
  prior: {
    rate: 0.419,
    games: 3,
  },
  matchup: {
    minSharedHeroes: 4,
    weight: 1,
  },
  teamHistory: {
    weight: 1,
    minGames: 1,
  },
};
