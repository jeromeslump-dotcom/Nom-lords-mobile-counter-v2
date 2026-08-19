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

  const usage = useMemo(
    () => calculateHeroUsage(combats),
    [combats]
  );

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

  const team = useMemo(
    () => (full ? recommendTeam(picks, combats) : []),
    [picks, full, combats]
  );

  const editedHeroes = useMemo(
    () =>
      editedTeam
        .map((id) => HEROES.find((h) => h.id === id))
        .filter(Boolean),
    [editedTeam]
  );

  const report = useMemo(
    () =>
      full && showResult && editedHeroes.length === MAX_PICKS
        ? coverageReport(editedHeroes as any, picks)
        : [],
    [editedHeroes, picks, full, showResult]
  );

  const totalCoverage = report.reduce(
    (acc, result) => acc + result.targets.length,
    0
  );

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
  };
}
