import { useState } from "react";
import type { HeroClass } from "../heroes";
import type { HeroSort } from "../utils/heroRanking";

export function useAppUI(
  resetSelection: () => void
) {
  const [query, setQuery] =
    useState("");

  const [activeClass, setActiveClass] =
    useState<HeroClass | "All">("All");

  const [sortBy, setSortBy] =
    useState<HeroSort>("played");

  const [showResult, setShowResult] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [showManual, setShowManual] =
    useState(false);

  const [showHeroManager, setShowHeroManager] =
    useState(false);

  const [
    hiddenRecommendedIds,
    setHiddenRecommendedIds,
  ] = useState<Set<string>>(new Set());

  const hideRecommendedHero = (
    heroId: string
  ) => {
    setHiddenRecommendedIds((previous) => {
      const next = new Set(previous);
      next.add(heroId);
      return next;
    });
  };

  const reset = () => {
    resetSelection();
    setQuery("");
    setActiveClass("All");
    setShowResult(false);
  };

  return {
    query,
    setQuery,

    activeClass,
    setActiveClass,

    sortBy,
    setSortBy,

    showResult,
    setShowResult,

    showHistory,
    setShowHistory,

    showManual,
    setShowManual,

    showHeroManager,
    setShowHeroManager,

    hiddenRecommendedIds,
    setHiddenRecommendedIds,
    hideRecommendedHero,

    reset,
  };
}