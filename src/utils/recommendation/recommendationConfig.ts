export interface RecommendationConfig {
  /**
   * Poids du moteur de contre théorique.
   *
   * Plus cette valeur est élevée, plus les avantages de type/classe
   * ont d'influence sur la recommandation finale.
   *
   * Valeur actuelle du moteur : 5
   */
  counter: number;

  /**
   * Poids de l'historique des combats.
   *
   * Influence les recommandations en fonction des résultats réellement
   * enregistrés dans l'application.
   *
   * Valeur actuelle du moteur : 7
   */
  history: number;

  /**
   * Poids des synergies entre héros.
   *
   * Influence les équipes dont les héros fonctionnent bien ensemble.
   *
   * Valeur actuelle du moteur : 2
   */
  synergy: number;

  /**
   * Poids des rôles/classes.
   *
   * Influence la composition globale de l'équipe.
   *
   * Valeur actuelle du moteur : 1
   */
  role: number;

  /**
   * Poids de l'analyse 4 + 1.
   *
   * Intègre les résultats de matchupAnalysis.ts dans le score final.
   *
   * Valeur actuelle : 1
   */
  matchup: number;

  /**
   * Poids de l'historique des équipes complètes.
   *
   * Intègre les résultats de teamHistory.ts dans le score final.
   *
   * Valeur actuelle : 1
   */
  teamHistory: number;

  /**
   * Taux de victoire utilisé comme référence lorsque l'historique
   * contient peu de combats.
   *
   * Valeur actuelle : 41.9 %
   */
  priorRate: number;

  /**
   * Nombre de combats servant de référence pour le prior.
   *
   * Plus cette valeur est élevée, plus les petits échantillons
   * sont "ramenés" vers le taux moyen.
   *
   * Valeur actuelle : 3
   */
  priorGames: number;
}

/**
 * Configuration actuelle du moteur.
 *
 * Les analyses historiques sont désormais actives :
 * - matchup = analyse 4 + 1 ;
 * - teamHistory = historique des équipes complètes.
 */
export const RECOMMENDATION_CONFIG: RecommendationConfig = {
  counter: 5,
  history: 7,
  synergy: 2,
  role: 1,

  matchup: 1,
  teamHistory: 1,

  priorRate: 0.419,
  priorGames: 3,
};
