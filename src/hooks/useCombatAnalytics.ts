import { useMemo } from "react";

import {
  calculateHeroUsage,
  findBestHistoricalTeam,
  calculateWinRate,
} from "../utils/combatStats";
import { filterAndSortHeroes, type HeroSort } from "../utils/heroRanking";
import { HEROES, type HeroClass } from "../heroes";
import { coverageReport, recommendTeam } from "../counter";
import type { Combat } from "../storage";

import { calculateTeamStats, compareStat } from "../utils/teamStats";

const MAX_PICKS = 5;

interface UseCombatAnalyticsOptions {
  combats: Combat[];
  picks: string[];
  editedTeam: string[];
  enabledHeroIds: Set<string>;
  activeClass: HeroClass | "All";
  query: string;
  sortBy: HeroSort;
  showResult: boolean;
}

export function useCombatAnalytics({
  combats,
  picks,
  editedTeam,
  enabledHeroIds,
  activeClass,
  query,
  sortBy,
  showResult,
}: UseCombatAnalyticsOptions) {
  const pickSet = useMemo(() => new Set(picks), [picks]);

  const full = picks.length === MAX_PICKS;

  /* ---------------------------------------------------------
   * UTILISATION DES HÉROS
   * --------------------------------------------------------- */

  const usage = useMemo(() => calculateHeroUsage(combats), [combats]);

  /* ---------------------------------------------------------
   * FILTRE / CLASSEMENT DES HÉROS
   * --------------------------------------------------------- */

  const filtered = useMemo(
    () =>
      filterAndSortHeroes(HEROES, {
        enabledHeroIds,
        activeClass,
        query,
        sortBy,
        usage,
      }),
    [enabledHeroIds, activeClass, query, sortBy, usage]
  );

  /* ---------------------------------------------------------
   * ÉQUIPE RECOMMANDÉE
   * --------------------------------------------------------- */

  const team = useMemo(() => {
    if (!full) {
      return [];
    }

    try {
      const result = recommendTeam(picks, combats);

      return result;
    } catch (error) {
      console.error("RECOMMEND ERROR", error);
      return [];
    }
  }, [picks, full, combats]);

  /* ---------------------------------------------------------
   * HÉROS DE L'ÉQUIPE MODIFIÉE
   * --------------------------------------------------------- */

  const editedHeroes = useMemo(
    () =>
      editedTeam
        .map((id) => HEROES.find((h) => h.id === id))
        .filter((hero): hero is (typeof HEROES)[number] => Boolean(hero)),
    [editedTeam]
  );

  /* ---------------------------------------------------------
   * HÉROS ENNEMIS
   * --------------------------------------------------------- */

  const enemyHeroes = useMemo(
    () =>
      picks
        .map((id) => HEROES.find((h) => h.id === id))
        .filter((hero): hero is (typeof HEROES)[number] => Boolean(hero)),
    [picks]
  );

  /* ---------------------------------------------------------
   * STATS ENNEMIS
   * --------------------------------------------------------- */

  const enemyStats = useMemo(
    () => calculateTeamStats(enemyHeroes),
    [enemyHeroes]
  );

  /* ---------------------------------------------------------
   * STATS ÉQUIPE
   * --------------------------------------------------------- */

  const teamStats = useMemo(
    () => calculateTeamStats(editedHeroes),
    [editedHeroes]
  );

  /* ---------------------------------------------------------
   * COMPARAISON DES STATS
   * --------------------------------------------------------- */

  const statComparisons = useMemo(
    () => ({
      hp: compareStat(enemyStats.hp, teamStats.hp),

      atk: compareStat(enemyStats.atk, teamStats.atk),

      def: compareStat(enemyStats.def, teamStats.def),

      matk: compareStat(enemyStats.matk, teamStats.matk),

      mdef: compareStat(enemyStats.mdef, teamStats.mdef),

      totalAtk: compareStat(enemyStats.totalAtk, teamStats.totalAtk),

      totalDef: compareStat(enemyStats.totalDef, teamStats.totalDef),
    }),
    [enemyStats, teamStats]
  );

  /* ---------------------------------------------------------
   * RAPPORT DE COUVERTURE
   * --------------------------------------------------------- */

  const report = useMemo(() => {
    if (!full || !showResult) {
      return [];
    }

    const currentTeam = editedTeam.length === MAX_PICKS ? editedHeroes : team;

    if (currentTeam.length !== MAX_PICKS) {
      return [];
    }

    return coverageReport(currentTeam, picks);
  }, [full, showResult, editedTeam, editedHeroes, team, picks]);

  /* ---------------------------------------------------------
   * COUVERTURE TOTALE
   * --------------------------------------------------------- */

  const totalCoverage = report.reduce(
    (acc, result) => acc + result.targets.length,
    0
  );

  /* ---------------------------------------------------------
   * MEILLEURE ÉQUIPE HISTORIQUE
   * --------------------------------------------------------- */

  const bestWinTeam = useMemo(() => {
    if (!full || !showResult || combats.length === 0) {
      return null;
    }

    const currentTeamIds =
      editedTeam.length === MAX_PICKS
        ? editedTeam
        : team.map((hero) => hero.id);

    return findBestHistoricalTeam(combats, picks, currentTeamIds);
  }, [combats, picks, full, showResult, editedTeam, team]);

  /* ---------------------------------------------------------
   * TAUX DE VICTOIRE
   * --------------------------------------------------------- */

  const winRate = useMemo(() => {
    if (!full || !showResult) {
      return null;
    }

    const teamIds =
      editedTeam.length === MAX_PICKS
        ? editedTeam
        : team.map((hero) => hero.id);

    return calculateWinRate(combats, picks, teamIds);
  }, [combats, picks, full, showResult, editedTeam, team]);

  /* ---------------------------------------------------------
   * RETURN
   * --------------------------------------------------------- */

  return {
    pickSet,
    full,
    usage,
    filtered,
    team,
    editedHeroes,
    report,
    totalCoverage,
    bestWinTeam,
    winRate,

    enemyStats,
    teamStats,
    statComparisons,
  };
}
