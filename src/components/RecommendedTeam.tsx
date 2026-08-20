import { RotateCcw, Swords, Trophy, X, Crown, Plus } from "lucide-react";

import {
  HEROES,
  TYPE_TEXT,
  CLASS_TEXT,
} from "../heroes";

import type { Hero } from "../heroes";

import type { TeamStats, TeamStatComparison,} from "../utils/teamStats";

const TYPE_GRADIENT: Record<string, string> = {
  Infantry: "from-red-900 via-red-700 to-orange-900",
  Cavalry: "from-blue-900 via-blue-700 to-cyan-900",
  Ranged: "from-emerald-900 via-green-700 to-teal-900",
  "Siege Engine": "from-purple-900 via-violet-700 to-indigo-900",
};

type ReportItem = {
  hero: Hero;
  targets: Hero[];
};

type WinRate = {
  rate: number;
  count: number;
} | null;

type BestWinTeam = {
  ids: string[];
  rate: number;
  count: number;
} | null;

type RecommendedTeamProps = {
  report: ReportItem[];
  editedHeroes: Hero[];
  editedTeam: string[];
  setEditedTeam: React.Dispatch<React.SetStateAction<string[]>>;
   enemyStats: TeamStats;
  teamStats: TeamStats;

  statComparisons: {
    hp: TeamStatComparison;
    atk: TeamStatComparison;
    def: TeamStatComparison;
    matk: TeamStatComparison;
    mdef: TeamStatComparison;
    totalAtk: TeamStatComparison;
    totalDef: TeamStatComparison;
  };

  hiddenRecommendedIds: Set<string>;
  hideRecommendedHero: (heroId: string) => void;
  setHiddenRecommendedIds: React.Dispatch<
    React.SetStateAction<Set<string>>
  >;

  swapIndex: number | null;
  setSwapIndex: React.Dispatch<React.SetStateAction<number | null>>;
  swapQuery: string;
  setSwapQuery: React.Dispatch<React.SetStateAction<string>>;

  usage: Record<string, number>;
  enabledHeroIds: Set<string>;

  winRate: WinRate;
  bestWinTeam: BestWinTeam;

  recordCombat: (won: boolean) => void;
  recording: boolean;

  reset: () => void;
};

export default function RecommendedTeam({
  report,
  editedHeroes,
  editedTeam,
  setEditedTeam,
    enemyStats,
  teamStats,
  statComparisons,

  hiddenRecommendedIds,
  hideRecommendedHero,
  setHiddenRecommendedIds,

  swapIndex,
  setSwapIndex,
  swapQuery,
  setSwapQuery,

  usage,
  enabledHeroIds,

  winRate,
  bestWinTeam,

  recordCombat,
  recording,

  reset,
}: RecommendedTeamProps) {
  return (
    <div className="mb-8">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">

        <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">

          <Swords className="h-5 w-5 text-amber-400" />

          Équipe recommandée

          {winRate !== null ? (
            <span
              className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${
                winRate.rate >= 50
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />

              {winRate.rate}%
              de victoire

              <span className="text-[10px] font-normal opacity-60">
                (
                {winRate.count} combat
                {winRate.count > 1 ? "s" : ""}
                )
              </span>
            </span>
          ) : (
            <span className="text-xs font-normal text-white/30">
              Pas encore de données
            </span>
          )}

        </h2>

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() => {
              setHiddenRecommendedIds(new Set());
            }}
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-amber-300 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>

        </div>

      </div>

      {/* =================================================
          TEAM CARDS
          ================================================= */}

            <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-6">

        {report.map(({ hero, targets }, idx) => {

          const hidden =
            hiddenRecommendedIds.has(hero.id);

          return (
            <div
              key={hero.id}
              className="transition-all"
            >

              {hidden ? (

                /* =================================================
                   HERO MASQUÉ
                   ================================================= */

                <div
                  className="aspect-square rounded-2xl border border-dashed border-amber-400/30 bg-white/[0.02] flex flex-col items-center justify-center gap-2"
                >

                  <span className="text-white/20 text-3xl">
                    +
                  </span>

                  <span className="text-[10px] text-white/40 text-center px-2">
                    Héros retiré
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSwapIndex(idx);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-[10px] text-cyan-300 hover:bg-cyan-400/20 transition-all"
                  >
                    Changer
                  </button>

                </div>

              ) : (

                /* =================================================
                   CARTE RECOMMANDATION
                   ================================================= */

                <>

                  <div
                    className="aspect-square rounded-2xl border border-white/10 overflow-hidden relative bg-[#11151c]"
                  >

                    {/* CROIX */}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        hideRecommendedHero(hero.id);
                      }}
                      className="absolute top-2 right-2 z-50 h-8 w-8 rounded-full bg-black/85 border-2 border-white/70 text-white flex items-center justify-center shadow-lg hover:bg-rose-500 hover:border-rose-300 transition-all cursor-pointer"
                      title="Retirer ce héros"
                      aria-label={`Retirer ${hero.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <img
                      src={hero.img}
                      alt={hero.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />

                    {/* NOM */}

                    <span className="absolute bottom-2 left-2 right-2 text-xs sm:text-sm font-bold text-center drop-shadow-lg line-clamp-1">
                      {hero.name}
                    </span>

                  </div>

                  {/* PSEUDO */}

                  <div className="mt-1.5 text-center text-[11px] sm:text-xs font-semibold text-white/75 truncate">
                    {hero.alias}
                  </div>

                  {/* TYPE + CLASSE */}

                  <div className="mt-0.5 flex items-center justify-center gap-1">

                    <span
                      className={`inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-md bg-black/70 border border-white/20 text-[10px] font-black ${TYPE_TEXT[hero.type]}`}
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
                      className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md bg-black/70 border border-white/20 text-[10px] font-black ${CLASS_TEXT[hero.cls]}`}
                      title={hero.cls}
                    >
                      {hero.cls}
                    </span>

                  </div>

                  {/* ENNEMIS COUVERTS */}

                  <div className="mt-2 text-center">

                    <div className="flex flex-wrap items-center justify-center gap-1">

                      {targets.map((target) => {

                        const enemy =
                          HEROES.find(
                            (h) => h.id === target.id
                          );

                        if (!enemy) {
                          return null;
                        }

                        return (
                          <span
                            key={target.id}
                            title={`Contre ${enemy.name}`}
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-200 border border-rose-500/20"
                          >

                            <img
                              src={enemy.img}
                              alt=""
                              className="h-3 w-3 rounded object-cover"
                            />

                            {enemy.name}

                          </span>
                        );
                      })}

                    </div>

                  </div>

                </>

              )}

            </div>
          );
        })}

      </div>

      {/* =================================================
          SWAP MODAL
          ================================================= */}

      {swapIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => {
            setSwapIndex(null);
            setSwapQuery("");
          }}
        >

          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between mb-4">

              <h3 className="text-sm font-bold text-white/80">
                Remplacer{" "}
                {editedHeroes[swapIndex]?.name}
              </h3>

              <button
                onClick={() => {
                  setSwapIndex(null);
                  setSwapQuery("");
                }}
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <X className="h-4 w-4 text-white" />
              </button>

            </div>

            <input
              autoFocus
              value={swapQuery}
              onChange={(e) =>
                setSwapQuery(e.target.value)
              }
              placeholder="Rechercher..."
              className="w-full mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
            />

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">

              {HEROES
                .filter((h) =>
                  enabledHeroIds.has(h.id)
                )
                .filter(
                  (h) =>
                    h.id !== editedTeam[swapIndex] &&
                    !editedTeam.includes(h.id)
                )
                .filter(
                  (h) =>
                    !swapQuery ||
                    h.name
                      .toLowerCase()
                      .includes(swapQuery.toLowerCase()) ||
                    h.alias
                      .toLowerCase()
                      .includes(swapQuery.toLowerCase())
                )
                .sort(
                  (a, b) =>
                    (usage[b.id] ?? 0) -
                      (usage[a.id] ?? 0) ||
                    a.name.localeCompare(b.name)
                )
                .map((h) => (

                  <button
                    key={h.id}
                    onClick={() => {

                      setEditedTeam((prev) =>
                        prev.map((id, i) =>
                          i === swapIndex
                            ? h.id
                            : id
                        )
                      );

                      setSwapIndex(null);
                      setSwapQuery("");

                    }}
                    className="group relative w-full overflow-hidden rounded-xl border border-white/10 hover:border-amber-400/50 hover:scale-[1.03] transition-all"
                  >

                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[h.type]} opacity-80`}
                    />

                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors" />

                    <div className="relative p-2 flex flex-col items-center gap-1">

                      <img
                        src={h.img}
                        alt={h.name}
                        loading="lazy"
                        className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/20"
                      />

                      <span className="text-white font-semibold text-[11px] text-center leading-tight drop-shadow line-clamp-1">
                        {h.name}
                      </span>

                      <span
                        className={`text-[8px] uppercase tracking-wider font-bold ${CLASS_TEXT[h.cls]} drop-shadow`}
                      >
                        {h.cls}
                      </span>

                    </div>

                  </button>

                ))}

            </div>

          </div>

        </div>
      )}
	  
 {/* =================================================
    TEAM STATS COMPARISON
    ================================================= */}

<div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">

<h3 className="text-sm font-bold text-white/80 mb-4 text-center">
  Comparaison des statistiques
</h3>

  {/* EN-TÊTE */}

<div className="flex justify-center">
  <div className="grid grid-cols-[115px_72px_58px_88px] items-center gap-x-2 px-2">

    <span />

    <span className="text-[9px] uppercase tracking-wider font-bold text-white/30 text-right whitespace-nowrap">
      Ennemi
    </span>

    <span className="text-[9px] uppercase tracking-wider font-bold text-white/30 text-right whitespace-nowrap">
      Écart
    </span>

    <span className="text-[9px] uppercase tracking-wider font-bold text-white/30 text-right whitespace-nowrap">
      Recommandée
    </span>

  </div>
  </div>

  {/* STATISTIQUES */}

  {[
    {
      key: "hp",
      label: "❤️ PV",
      enemy: enemyStats.hp,
      team: teamStats.hp,
      comparison: statComparisons.hp,
    },
    {
      key: "atk",
      label: "⚔️ ATQ",
      enemy: enemyStats.atk,
      team: teamStats.atk,
      comparison: statComparisons.atk,
    },
    {
      key: "matk",
      label: "✨ ATQ MAG",
      enemy: enemyStats.matk,
      team: teamStats.matk,
      comparison: statComparisons.matk,
    },
    {
      key: "totalAtk",
      label: "⚔️ ATQ totale",
      enemy: enemyStats.totalAtk,
      team: teamStats.totalAtk,
      comparison: statComparisons.totalAtk,
    },
    {
      key: "def",
      label: "🛡️ DEF",
      enemy: enemyStats.def,
      team: teamStats.def,
      comparison: statComparisons.def,
    },
    {
      key: "mdef",
      label: "🛡️ MDEF",
      enemy: enemyStats.mdef,
      team: teamStats.mdef,
      comparison: statComparisons.mdef,
    },
    {
      key: "totalDef",
      label: "🛡️ DEF totale",
      enemy: enemyStats.totalDef,
      team: teamStats.totalDef,
      comparison: statComparisons.totalDef,
    },
  ].map((stat) => {

    const positive =
      stat.comparison.difference >= 0;

    const separator =
      stat.key === "def";

    return (

<div className="flex justify-center">
  <div
    key={stat.key}
    className={`grid grid-cols-[115px_72px_58px_88px] items-center gap-x-2 px-2 py-1.5 rounded-lg ${
      separator
        ? "mt-3 pt-3 border-t border-white/10"
        : ""
    }`}
  >

        {/* STAT */}

        <span className="text-xs font-semibold text-white/65 whitespace-nowrap">
          {stat.label}
        </span>

        {/* ENNEMI */}

        <span className="text-xs tabular-nums text-white/45 text-right whitespace-nowrap">
          {stat.enemy.toLocaleString("fr-FR")}
        </span>

        {/* ÉCART */}

        <span
          className={`text-xs font-bold tabular-nums text-right whitespace-nowrap ${
            positive
              ? "text-emerald-400"
              : "text-rose-400"
          }`}
        >
          {positive ? "+" : ""}
          {stat.comparison.percentage.toFixed(1)}%
        </span>

        {/* RECOMMANDÉE */}

        <span className="text-xs font-bold tabular-nums text-white text-right whitespace-nowrap">
          {stat.team.toLocaleString("fr-FR")}
        </span>

      </div>
	  </div>
    );
  })}

</div>
	  

      {/* =================================================
          BEST WIN TEAM
          ================================================= */}

      {bestWinTeam && (
        <div className="mt-8 mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4">

          <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-amber-300">

            <Crown className="h-4 w-4" />

            Équipe de contre ayant le plus gagné

            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">

              {bestWinTeam.rate}%
              de victoire

              <span className="text-[10px] font-normal opacity-60">
                (
                {bestWinTeam.count} combat
                {bestWinTeam.count > 1 ? "s" : ""}
                )
              </span>

            </span>

          </h3>

          <div className="grid grid-cols-5 gap-2">

            {bestWinTeam.ids.map((id) => {

              const h =
                HEROES.find(
                  (x) => x.id === id
                );

              if (!h) {
                return null;
              }

              return (
                <button
                  key={id}
                  onClick={() =>
                    setEditedTeam(bestWinTeam.ids)
                  }
                  className="group relative rounded-xl overflow-hidden border border-amber-500/30 hover:border-amber-400/60 hover:scale-[1.03] transition-all"
                >

                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[h.type]} opacity-70`}
                  />

                  <div className="absolute inset-0 bg-black/30" />

                  <div className="relative p-2 flex flex-col items-center gap-1">

                    <img
                      src={h.img}
                      alt={h.name}
                      loading="lazy"
                      className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/20"
                    />

                    <span className="text-white font-semibold text-[11px] text-center leading-tight drop-shadow line-clamp-1">
                      {h.name}
                    </span>

                    <span
                      className={`text-[8px] uppercase tracking-wider font-bold ${CLASS_TEXT[h.cls]} drop-shadow`}
                    >
                      {h.cls}
                    </span>

                  </div>

                </button>
              );
            })}

          </div>

          <p className="mt-3 text-[11px] text-white/40">
            Clique sur l'équipe pour
            l'utiliser. Basé sur tes combats
            passés contre une composition
            ennemie similaire.
          </p>

        </div>
      )}

      {/* =================================================
          RECORD RESULT
          ================================================= */}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">

        <div className="flex items-center gap-2 mb-3">

          <Plus className="h-4 w-4 text-amber-400" />

          <span className="text-sm font-medium text-white/80">
            Enregistrer le résultat de ce combat
          </span>

        </div>

        <p className="text-xs text-white/50 mb-3">
          Tes résultats influencent les futures
          recommandations pour cette composition ennemie.
        </p>

        <div className="flex gap-2">

          <button
            onClick={() => recordCombat(true)}
            disabled={recording}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            <Trophy className="inline h-4 w-4 mr-1" />
            Victoire
          </button>

          <button
            onClick={() => recordCombat(false)}
            disabled={recording}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold hover:bg-rose-500/30 transition-colors disabled:opacity-50"
          >
            Défaite
          </button>

        </div>

      </div>

      {/* =================================================
          RESET
          ================================================= */}

      <div className="mt-5 flex justify-center">

        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Recommencer
        </button>

      </div>

    </div>
  );
}