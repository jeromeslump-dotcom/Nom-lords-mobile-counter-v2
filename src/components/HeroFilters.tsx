import type { HeroClass } from "../heroes";
import type { HeroSort } from "../utils/heroRanking";

interface HeroFiltersProps {
  query: string;
  setQuery: (value: string) => void;
  sortBy: HeroSort;
  setSortBy: (value: HeroSort) => void;
  activeClass: HeroClass | "All";
  setActiveClass: (value: HeroClass | "All") => void;
}

export default function HeroFilters({
  query,
  setQuery,
  sortBy,
  setSortBy,
  activeClass,
  setActiveClass,
}: HeroFiltersProps) {
  const sortOptions = [
    ["played", "Plus joués"],
    ["hp", "PV"],
    ["atk", "ATQ"],
    ["matk", "ATQ MAG"],
    ["def", "DEF"],
    ["mdef", "MDEF"],
  ] as const;

  const classOptions: (HeroClass | "All")[] = [
    "All",
    "STR",
    "AGI",
    "INT",
  ];

  return (
    <div className="flex flex-col gap-3 mb-5">

      {/* RECHERCHE */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou alias..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
        />
      </div>

      {/* CLASSEMENT */}
      <div className="flex flex-wrap gap-2">
        {sortOptions.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setSortBy(value)}
            className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              sortBy === value
                ? "bg-amber-400 text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* CLASSES */}
      <div className="flex flex-wrap gap-2">
        {classOptions.map((value) => (
          <button
            key={value}
            onClick={() => setActiveClass(value)}
            className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              activeClass === value
                ? "bg-white text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {value === "All" ? "Toutes classes" : value}
          </button>
        ))}
      </div>

    </div>
  );
}