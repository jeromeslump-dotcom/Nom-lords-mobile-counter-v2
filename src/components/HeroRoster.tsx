import {
  TYPE_TEXT,
  CLASS_TEXT,
  formatStat,
} from "../heroes";

import type { Hero } from "../heroes";

const TYPE_GRADIENT: Record<string, string> = {
  Infantry: "from-red-900 via-red-700 to-orange-900",
  Cavalry: "from-blue-900 via-blue-700 to-cyan-900",
  Ranged: "from-emerald-900 via-green-700 to-teal-900",
  "Siege Engine": "from-purple-900 via-violet-700 to-indigo-900",
};

interface HeroRosterProps {
  filtered: Hero[];
  pickSet: Set<string>;
  picks: string[];
  full: boolean;
  enabledHeroIds: Set<string>;
  toggle: (heroId: string, enabledIds: Set<string>) => void;
}

export default function HeroRoster({
  filtered,
  pickSet,
  picks,
  full,
  enabledHeroIds,
  toggle,
}: HeroRosterProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {filtered.map((hero) => (
        <button
          key={hero.id}
          onClick={() => toggle(hero.id, enabledHeroIds)}
          disabled={full && !pickSet.has(hero.id)}
          className={`group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
            pickSet.has(hero.id)
              ? "border-amber-400/80 ring-1 ring-amber-400/50 scale-[1.02] shadow-lg"
              : full
              ? "border-white/10 opacity-30 cursor-not-allowed"
              : "border-white/10 hover:border-white/25 hover:bg-white/[0.025] hover:scale-[1.02] cursor-pointer"
          }`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[hero.type]} opacity-30`}
          />

          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors" />

          <div className="relative p-2.5 flex flex-col items-center">

            {/* NUMERO DE SELECTION */}
            {pickSet.has(hero.id) && (
              <div className="absolute top-2 left-2 z-20 h-7 w-7 rounded-full bg-amber-400 text-black text-xs font-black flex items-center justify-center shadow-lg ring-2 ring-black/50">
                {picks.indexOf(hero.id) + 1}
              </div>
            )}

            {/* IMAGE */}
            <img
              src={hero.img}
              alt={hero.name}
              loading="lazy"
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover ring-1 ring-white/20 shadow-lg"
            />

            {/* NOM */}
            <span className="mt-2 text-white font-bold text-xs sm:text-sm text-center leading-tight drop-shadow line-clamp-1 w-full">
              {hero.name}
            </span>

            {/* PSEUDO */}
            <span className="mt-0.5 text-[10px] sm:text-xs font-semibold text-white/60 text-center truncate w-full">
              {hero.alias}
            </span>

            {/* TYPE + CLASSE */}
            <div className="mt-1.5 flex items-center justify-center gap-1.5">

              <span
                className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md bg-black/70 border border-white/20 text-[9px] font-black ${TYPE_TEXT[hero.type]}`}
                title={hero.type}
              >
                {hero.type === "Infantry"
                  ? "🛡️"
                  : hero.type === "Cavalry"
                  ? "🐎"
                  : hero.type === "Ranged"
                  ? "🏹"
                  : "⚙️"}
              </span>

              <span
                className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md bg-black/70 border border-white/20 text-[9px] font-black ${CLASS_TEXT[hero.cls]}`}
                title={hero.cls}
              >
                {hero.cls}
              </span>

            </div>

            {/* STATS */}
            <div className="mt-2 w-full grid grid-cols-2 gap-x-2 gap-y-1 rounded-lg bg-black/35 border border-white/5 px-2 py-1.5 text-[9px]">

              <div className="flex items-center justify-between gap-1">
                <span className="text-rose-300/90 font-bold">
                  PV
                </span>
                <span className="font-bold text-white/80">
                  {formatStat(hero.stats.hp)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-amber-300/90 font-bold">
                  ATK
                </span>
                <span className="font-bold text-white/80">
                  {formatStat(hero.stats.atk)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-sky-300/90 font-bold">
                  MATK
                </span>
                <span className="font-bold text-white/80">
                  {formatStat(hero.stats.matk)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-emerald-300/90 font-bold">
                  DEF
                </span>
                <span className="font-bold text-white/80">
                  {formatStat(hero.stats.def)}
                </span>
              </div>

              <div className="col-span-2 flex items-center justify-between gap-1 border-t border-white/5 pt-1">
                <span className="text-indigo-300/90 font-bold">
                  MDEF
                </span>
                <span className="font-bold text-white/80">
                  {formatStat(hero.stats.mdef)}
                </span>
              </div>

            </div>

          </div>
        </button>
      ))}
    </div>
  );
}