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
   * Permettra d'intégrer les résultats de matchupAnalysis.ts.
   *
   * 0 = désactivé.
   */
  matchup: number;

  /**
   * Poids de l'historique des équipes complètes.
   *
   * Permettra d'intégrer les résultats de teamHistory.ts.
   *
   * 0 = désactivé.
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
 * IMPORTANT :
 * Les valeurs historiques restent inchangées ici.
 *
 * Les nouvelles analyses sont volontairement désactivées avec un poids
 * de 0 tant qu'elles ne sont pas branchées et validées.
 */
export const RECOMMENDATION_CONFIG: RecommendationConfig = {
  counter: 5,
  history: 7,
  synergy: 2,
  role: 1,

  matchup: 0,
  teamHistory: 1,

  priorRate: 0.419,
  priorGames: 3,
};
