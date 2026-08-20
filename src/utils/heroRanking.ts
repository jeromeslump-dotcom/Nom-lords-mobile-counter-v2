import type { Hero, HeroClass } from "../heroes";

export type HeroRanking =
  | "played"
  | "hp"
  | "atk"
  | "matk"
  | "totalAtk"
  | "def"
  | "mdef"
  | "totalDef";

export interface HeroRankingOptions {
  enabledHeroIds: Set<string>;
  activeClass: HeroClass | "All";
  query: string;
  sortBy: HeroSort;
  usage: Record<string, number>;
}

/**
 * Applies the same filtering and sorting currently used by App.tsx.
 * This is deliberately a pure function: it does not mutate React state
 * and it does not change the ranking rules.
 */
export function filterAndSortHeroes(
  heroes: Hero[],
  options: HeroRankingOptions
): Hero[] {
  const {
    enabledHeroIds,
    activeClass,
    query,
    sortBy,
    usage,
  } = options;

  const normalizedQuery = query.trim().toLowerCase();

  return heroes
    .filter((hero) => {
      if (!enabledHeroIds.has(hero.id)) {
        return false;
      }

      if (
        activeClass !== "All" &&
        hero.cls !== activeClass
      ) {
        return false;
      }

      if (
        normalizedQuery &&
        !hero.name.toLowerCase().includes(normalizedQuery) &&
        !hero.alias.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "hp":
          return b.stats.hp - a.stats.hp;
        case "atk":
          return b.stats.atk - a.stats.atk;
        case "matk":
          return b.stats.matk - a.stats.matk;
		 case "totalAtk":
  return (
    b.stats.atk +
    b.stats.matk -
    (a.stats.atk + a.stats.matk)
  );
        case "def":
          return b.stats.def - a.stats.def;
        case "mdef":
          return b.stats.mdef - a.stats.mdef;
		  case "totalDef":
  return (
    b.stats.def +
    b.stats.mdef -
    (a.stats.def + a.stats.mdef)
  );
        case "played":
        default:
          return (usage[b.id] ?? 0) - (usage[a.id] ?? 0);
      }
    });
}
