import {
  filterAndSortHeroes,
  type HeroSort,
} from "./utils/heroRanking";

import { reorderArray } from "./utils/selectionUtils";

import {
  calculateHeroUsage,
  findBestHistoricalTeam,
  calculateWinRate,
} from "./utils/combatStats";

import { useHeroPreferences } from "./hooks/useHeroPreferences";
import { useAuth } from "./hooks/useAuth";
import { useCombatHistory } from "./hooks/useCombatHistory";
import { useManualCombat } from "./hooks/useManualCombat";

import { useEffect, useMemo, useState } from "react";
import {
  RotateCcw,
  Search,
  Swords,
  Target,
  X,
  History,
  Trophy,
  Plus,
  Trash2,
  BookOpen,
  ArrowLeftRight,
  Crown,
  Shield,
  Scale,
  Settings,
  Check,
  CheckSquare,
  Square,
} from "lucide-react";

import {
  HEROES,
  CLASSES,
  HeroClass,
  TYPE_TEXT,
  CLASS_TEXT,
  formatStat,
} from "./heroes";

import {
  coverageReport,
  recommendTeam,
} from "./counter";

import type { Combat } from "./storage";

import {
  loadHeroPreferences,
  saveHeroPreferences,
} from "./storage";

import "./App.css";
import HeroManager from "./components/HeroManager";
import ManualCombatModal from "./components/ManualCombatModal";
import HeroSlots from "./components/HeroSlots";
import HeroGridPicker from "./components/HeroGridPicker";
import LoginModal from "./components/LoginModal";

const MAX_PICKS = 5;
const APP_VERSION = "2.1.0";

const TYPE_GRADIENT: Record<string, string> = {
  Infantry: "from-red-900 via-red-700 to-orange-900",
  Cavalry: "from-blue-900 via-blue-700 to-cyan-900",
  Ranged: "from-emerald-900 via-green-700 to-teal-900",
  "Siege Engine": "from-purple-900 via-violet-700 to-indigo-900",
};


/* =========================================================
   HERO GRID PICKER
   ========================================================= */

/* =========================================================
   HERO SLOTS
   ========================================================= */

/* =========================================================
   HERO MANAGEMENT MODAL
   ========================================================= */

/* =========================================================
   APP
   ========================================================= */

export default function App() {
  const [picks, setPicks] =
    useState<string[]>([]);

  const [query, setQuery] =
    useState("");
const {
  user,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginError,
  setLoginError,
  showLogin,
  setShowLogin,
  loggingIn,
  handleLogin,
  handleLogout,
} = useAuth(() => {
  setCombats([]);
});


const {
  combats,
  setCombats,
  loadingHistory,
  recording,
  recordCombat,
  deleteCombat,
} = useCombatHistory({
  user,
  picks,
  editedTeam,
});

const {
  mEnemies,
  setMEnemies,
  mMine,
  setMMine,
  mWon,
  setMWon,
  savingManual,
  toggleManual,
  saveManual,
  mReady,
} = useManualCombat({
  user,
  enabledHeroIds,
  onCombatSaved: (combat) => {
    setCombats((prev) => [
      combat,
      ...prev,
    ]);
  },
});

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

  const [editedTeam, setEditedTeam] =
    useState<string[]>([]);

  const [
    hiddenRecommendedIds,
    setHiddenRecommendedIds,
  ] = useState<Set<string>>(new Set());

  const hideRecommendedHero = (heroId: string) => {
    setHiddenRecommendedIds((previous) => {
      const next = new Set(previous);
      next.add(heroId);
      return next;
    });
  };



  const [swapIndex, setSwapIndex] =
    useState<number | null>(null);

  const [swapQuery, setSwapQuery] =
    useState("");

  const [dragIndex, setDragIndex] =
    useState<number | null>(null);

  const [dragOverIndex, setDragOverIndex] =
    useState<number | null>(null);

  /* =======================================================
     ENABLED HEROES — SUPABASE
     ======================================================= */
const {
  enabledHeroIds,
  setEnabledHeroIds,
  heroPreferencesLoaded,
  toggleHeroEnabled,
  enableAllHeroes,
 } = useHeroPreferences(user);

  /* =======================================================
     USER
     ======================================================= */

  /* =======================================================
     CLEAN DISABLED HEROES FROM CURRENT SELECTIONS
     ======================================================= */

  useEffect(() => {
    setPicks((prev) =>
      prev.filter((id) =>
        enabledHeroIds.has(id)
      )
    );

    setEditedTeam((prev) =>
      prev.filter((id) =>
        enabledHeroIds.has(id)
      )
    );

    setMEnemies((prev) =>
      prev.filter((id) =>
        enabledHeroIds.has(id)
      )
    );

    setMMine((prev) =>
      prev.filter((id) =>
        enabledHeroIds.has(id)
      )
    );
  }, [enabledHeroIds]);

  /* =======================================================
     HERO MANAGEMENT
     ======================================================= */

  function disableAllHeroes() {
    setEnabledHeroIds(new Set());
    setPicks([]);
    setEditedTeam([]);
    setMEnemies([]);
    setMMine([]);
    setShowResult(false);
  }

  /* =======================================================
     DERIVED DATA
     ======================================================= */

  const pickSet =
    useMemo(
      () => new Set(picks),
      [picks]
    );

  const full =
    picks.length === MAX_PICKS;

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
  [
    enabledHeroIds,
    activeClass,
    query,
    sortBy,
    usage,
  ]
);


const team =
  useMemo(
    () =>
      full
        ? recommendTeam(
            picks,
            combats
          )
        : [],
    [picks, full, combats]
  );

  const editedHeroes =
    useMemo(
      () =>
        editedTeam
          .map((id) =>
            HEROES.find(
              (h) => h.id === id
            )
          )
          .filter(Boolean),
      [editedTeam]
    );

  const report =
    useMemo(
      () =>
        full &&
        showResult &&
        editedHeroes.length === 5
          ? coverageReport(
              editedHeroes as any,
              picks
            )
          : [],
      [
        editedHeroes,
        picks,
        full,
        showResult,
      ]
    );

  const totalCoverage =
    report.reduce(
      (acc, r) =>
        acc + r.targets.length,
      0
    );

  /* =======================================================
     BEST HISTORICAL TEAM
     ======================================================= */

  const bestWinTeam = useMemo(() => {
  if (
    !full ||
    !showResult ||
    combats.length === 0
  ) {
    return null;
  }

  const currentTeamIds =
    editedTeam.length === 5
      ? editedTeam
      : team.map((hero) => hero.id);

  return findBestHistoricalTeam(
    combats,
    picks,
    currentTeamIds
  );
}, [
  combats,
  picks,
  full,
  showResult,
  editedTeam,
  team,
]);

  /* =======================================================
     WIN RATE
     ======================================================= */

 const winRate = useMemo(() => {
  if (!full || !showResult) {
    return null;
  }

  const teamIds =
    editedTeam.length === 5
      ? editedTeam
      : team.map((hero) => hero.id);

  return calculateWinRate(
    combats,
    picks,
    teamIds
  );
}, [
  combats,
  picks,
  full,
  showResult,
  editedTeam,
  team,
]);

  /* =======================================================
     LOGIN
     ======================================================= */
	 
  /* =======================================================
     SELECTION
     ======================================================= */

  function toggle(id: string) {
    if (
      !enabledHeroIds.has(id)
    ) {
      return;
    }

    setShowResult(false);

    setPicks((prev) =>
      prev.includes(id)
        ? prev.filter(
            (p) => p !== id
          )
        : prev.length >=
          MAX_PICKS
        ? prev
        : [...prev, id]
    );
  }

function reorderPicks(
  from: number,
  to: number
) {
  setPicks((prev) =>
    reorderArray(prev, from, to)
  );
}

function reorderManual(
  arr: string[],
  setArr: (
    v: string[]
  ) => void,
  from: number,
  to: number
) {
  setArr(
    reorderArray(
      arr,
      from,
      to
    )
  );
}

  function reset() {
    setPicks([]);
    setQuery("");
    setActiveClass("All");
    setShowResult(false);
    setEditedTeam([]);
    setSwapIndex(null);
  }

  /* =======================================================
     COMBAT RECORDING
     ======================================================= */

  /* =======================================================
     MANUAL COMBAT
     ======================================================= */

  const winCount =
    combats.filter(
      (c) => c.won
    ).length;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
   <div className="lmac-app relative overflow-hidden">

      {/* =================================================
          HERO MANAGER
          ================================================= */}

      {showHeroManager && (
        <HeroManager
          enabledIds={
            enabledHeroIds
          }
		  usage={usage}
          onToggleHero={
            toggleHeroEnabled
          }
          onEnableAll={
            enableAllHeroes
          }
          onDisableAll={
            disableAllHeroes
          }
          onClose={() =>
            setShowHeroManager(false)
          }
        />
      )}

      {/* =================================================
          LOGIN
          ================================================= */}

      {showLogin && (
        <LoginModal
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          loginError={loginError}
          loggingIn={loggingIn}
          handleLogin={handleLogin}
          onClose={() => {
            setShowLogin(false);
            setLoginError("");
          }}
        />
      )}

      {/* =================================================
          BACKGROUND
          ================================================= */}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.045),transparent_38%)]" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

{/* =================================================
    HEADER
    ================================================= */}

<header className="mb-10">
  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

    <div className="text-center lg:text-left">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.035] text-xs text-white/60 mb-4">
  <Swords className="h-3.5 w-3.5 text-amber-400" />
  <span>Lords Mobile Counter By Kikoine</span>
  <span className="text-white/30">•</span>
  <span className="text-amber-300/70">v{APP_VERSION}</span>
</div>

      <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
        Colisée des héros 
      </h1>

      <p className="mt-3 text-white/60 max-w-xl mx-auto lg:mx-0">
        Compose l'escouade adverse pour voir
        une équipe recommandée.
      </p>
    </div>

    <div className="flex flex-col items-center lg:items-end gap-3">

      {/* ADMIN */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <span className="text-xs text-emerald-300">
              👑 Connexion 👑
            </span>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 transition-colors"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setLoginError("");
              setShowLogin(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 hover:bg-amber-400/20 transition-colors"
          >
            Admin
          </button>
        )}
      </div>

      {/* HERO MANAGEMENT — ADMIN ONLY */}
      {user && (
        <button
          onClick={() => setShowHeroManager(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Settings className="h-4 w-4 text-amber-400" />

          <span className="text-xs font-semibold">
            Gérer les héros
          </span>

          <span className="text-[10px] text-white/30">
            {enabledHeroIds.size}/{HEROES.length}
          </span>
        </button>
      )}

      {/* HISTORY / MANUAL COMBAT — ADMIN ONLY */}
      <div className="flex items-center gap-3 text-sm flex-wrap justify-center lg:justify-end">
        {user ? (
          <>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
            >
              <History className="h-4 w-4" />

              {combats.length} combat
              {combats.length > 1 ? "s" : ""}

              <span className="text-white/30">
                ·
              </span>

              <Trophy className="h-3.5 w-3.5 text-amber-400" />

              {winCount} victoires
            </button>

            <button
              onClick={() => setShowManual(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Ajouter un combat à l'historique
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40">
            🔒 Historique et enregistrement 🔒
          </span>
        )}
      </div>

    </div>
  </div>
</header>

{/* =================================================
    HISTORY
    ================================================= */}

        {user &&
          showHistory && (
            <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/80">
                  Historique des combats
                </h3>

                <button
                  onClick={() =>
                    setShowHistory(false)
                  }
                  className="text-white/40 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {loadingHistory ? (
                <p className="text-center text-white/40 text-sm py-4">
                  Chargement...
                </p>
              ) : combats.length ===
                0 ? (
                <p className="text-center text-white/40 text-sm py-4">
                  Aucun combat enregistré.
                  Clique sur « Enregistrer
                  un combat passé » pour
                  commencer.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {combats.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-lg bg-white/[0.035] border border-white/10 p-2"
                    >
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          c.won
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {c.won
                          ? "VICTOIRE"
                          : "DÉFAITE"}
                      </span>

                      <span className="text-[10px] text-white/40 whitespace-nowrap">
                        {new Date(
                          c.created_at
                        ).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                          }
                        )}
                        {" · "}
                        {new Date(
                          c.created_at
                        ).toLocaleTimeString(
                          "fr-FR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-white/40">
                            Ennemis:
                          </span>

                          {c.enemy_heroes.map(
                            (id) => {
                              const h =
                                HEROES.find(
                                  (x) =>
                                    x.id ===
                                    id
                                );

                              return h ? (
                                <img
                                  key={id}
                                  src={h.img}
                                  alt={h.name}
                                  className="h-5 w-5 rounded object-cover"
                                  title={
                                    h.name
                                  }
                                />
                              ) : null;
                            }
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-wrap mt-1">
                          <span className="text-[10px] text-white/40">
                            Mon équipe:
                          </span>

                          {c.my_heroes.map(
                            (id) => {
                              const h =
                                HEROES.find(
                                  (x) =>
                                    x.id ===
                                    id
                                );

                              return h ? (
                                <img
                                  key={id}
                                  src={h.img}
                                  alt={h.name}
                                  className="h-5 w-5 rounded object-cover"
                                  title={
                                    h.name
                                  }
                                />
                              ) : null;
                            }
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          deleteCombat(
                            c.id
                          )
                        }
                        className="text-white/30 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* =================================================
            MANUAL COMBAT MODAL
            ================================================= */}

{showManual && (
<ManualCombatModal
  mEnemies={mEnemies}
  mMine={mMine}
  mWon={mWon}
  savingManual={savingManual}
  setShowManual={setShowManual}
  saveManual={saveManual}
  mReady={mReady}
  setMEnemies={setMEnemies}
  setMMine={setMMine}
  setMWon={setMWon}
  usage={usage}
  enabledHeroIds={enabledHeroIds}
/>
)}
        {/* =================================================
            PICKS
            ================================================= */}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-rose-400" />

              <span className="text-xl font-bold text-white/80">
                Ennemis choisis{" "}
                <span className="text-white/40">
                  ({picks.length}/{MAX_PICKS})
                </span>
              </span>
            </div>

            {picks.length > 0 && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {Array.from({
              length: MAX_PICKS,
            }).map((_, i) => {
              const id = picks[i];

              const hero = id
                ? HEROES.find(
                    (h) => h.id === id
                  )
                : null;

              return (
                <div
                  key={i}
                  draggable={!!hero}
                  onDragStart={() =>
                    setDragIndex(i)
                  }
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(i);
                  }}
                  onDrop={() => {
                    if (
                      dragIndex !== null &&
                      dragIndex !== i &&
                      picks[dragIndex]
                    ) {
                      reorderPicks(
                        dragIndex,
                        i
                      );
                    }

                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`transition-all ${
                    dragOverIndex === i &&
                    dragIndex !== null &&
                    dragIndex !== i
                      ? "ring-2 ring-cyan-400/60 scale-105 rounded-2xl"
                      : ""
                  } ${
                    dragIndex === i
                      ? "opacity-40"
                      : ""
                  }`}
                >
                  {hero ? (
                    <>
                      {/* CARTE */}
                      <div
                        className="aspect-square rounded-2xl border border-amber-400/50 overflow-hidden relative cursor-grab active:cursor-grabbing"
                      >
                        <img
                          src={hero.img}
                          alt={hero.name}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />

                        <button
                          onClick={() =>
                            toggle(hero.id)
                          }
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 hover:bg-rose-500 flex items-center justify-center transition-colors z-10"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>

                        {/* NOM SUR LA CARTE */}
                        <span className="absolute bottom-2 left-2 right-2 text-xs sm:text-sm font-bold text-center drop-shadow-lg line-clamp-1">
                          {hero.name}
                        </span>
                      </div>

                      {/* PSEUDO SOUS LA CARTE */}
                      <div className="mt-1.5 text-center text-[11px] sm:text-xs font-semibold text-white/75 truncate">
                        {hero.alias}
                      </div>

                      {/* TYPE + CLASSE SOUS LE PSEUDO */}
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
                      
                    </>
                  ) : (
                    <div className="aspect-square rounded-2xl border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center">
                      <span className="text-white/20 text-2xl font-light">
                        {i + 1}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================
            FIND TEAM
            ================================================= */}

        {full &&
          !showResult && (
            <div className="flex justify-center mb-8">
              <button
                onClick={() => {
                  setEditedTeam(
                    team
                      .map(
                        (h) =>
                          h.id
                      )
                      .filter(
                        (id) =>
                          enabledHeroIds.has(
                            id
                          )
                      )
                  );

                  setHiddenRecommendedIds(
                    new Set()
                  );

                  setShowResult(
                    true
                  );
                }}
                className="px-8 py-3 rounded-xl bg-amber-400 text-black font-bold shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
              >
                Trouver la meilleure contre
              </button>
            </div>
          )}

        {/* =================================================
            RESULT
            ================================================= */}

        {showResult &&
          full && (
            <div className="mb-8">

              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                  <Swords className="h-5 w-5 text-amber-400" />

                  Équipe recommandée

                  {winRate !== null ? (
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${
                        winRate.rate >=
                        50
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      <Trophy className="h-3.5 w-3.5" />

                      {winRate.rate}%
                      de victoire

                      <span className="text-[10px] font-normal opacity-60">
                        (
                        {
                          winRate.count
                        }{" "}
                        combat
                        {winRate.count >
                        1
                          ? "s"
                          : ""}
                        )
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-white/30">
                      Pas encore de
                      données
                    </span>
                  )}
                </h2>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHiddenRecommendedIds(
                        new Set()
                      );
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-amber-300 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* TEAM CARDS */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3">

                {report.map(
                  ({ hero }, idx) => {

                    const hidden =
                      hiddenRecommendedIds.has(hero.id);

                    return (
                      <div
                        key={hero.id}
                        className="transition-all"
                      >

                        {hidden ? (
                          /* =================================================
                             EMPLACEMENT HERO MASQUE
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

                                  hideRecommendedHero(
                                    hero.id
                                  );
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

                                {(
                                  report.find(
                                    (r) =>
                                      r.hero.id === hero.id
                                  )?.targets ?? []
                                ).map((t) => {

                                  const enemy =
                                    HEROES.find(
                                      (h) =>
                                        h.id === t.id
                                    );

                                  if (!enemy) {
                                    return null;
                                  }

                                  return (
                                    <span
                                      key={t.id}
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
                  }
                )}

              </div>

              {/* =================================================
                  SWAP MODAL
                  ================================================= */}

              {swapIndex !==
                null && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                  onClick={() =>
                    setSwapIndex(
                      null
                    )
                  }
                >
                  <div
                    className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 p-5 max-h-[80vh] overflow-y-auto"
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white/80">
                        Remplacer{" "}
                        {
                          editedHeroes[
                            swapIndex
                          ]?.name
                        }
                      </h3>

                      <button
                        onClick={() =>
                          setSwapIndex(
                            null
                          )
                        }
                        className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>

                    <input
                      autoFocus
                      value={
                        swapQuery
                      }
                      onChange={(e) =>
                        setSwapQuery(
                          e.target
                            .value
                        )
                      }
                      placeholder="Rechercher..."
                      className="w-full mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
                    />

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {HEROES
                        .filter(
                          (h) =>
                            enabledHeroIds.has(
                              h.id
                            )
                        )
                        .filter(
                          (h) =>
                            h.id !==
                              editedTeam[
                                swapIndex
                              ] &&
                            !editedTeam.includes(
                              h.id
                            )
                        )
                        .filter(
                          (h) =>
                            !swapQuery ||
                            h.name
                              .toLowerCase()
                              .includes(
                                swapQuery.toLowerCase()
                              ) ||
                            h.alias
                              .toLowerCase()
                              .includes(
                                swapQuery.toLowerCase()
                              )
                        )
                        .sort(
                          (a, b) =>
                            (usage[
                              b.id
                            ] ??
                              0) -
                              (usage[
                                a.id
                              ] ??
                                0) ||
                            a.name.localeCompare(
                              b.name
                            )
                        )
                        .map(
                          (h) => (
                            <button
                              key={
                                h.id
                              }
                              onClick={() => {
                                setEditedTeam(
                                  (
                                    prev
                                  ) =>
                                    prev.map(
                                      (
                                        id,
                                        i
                                      ) =>
                                        i ===
                                        swapIndex
                                          ? h.id
                                          : id
                                    )
                                );

                                setSwapIndex(
                                  null
                                );

                                setSwapQuery(
                                  ""
                                );
                              }}
                              className="group relative w-full overflow-hidden rounded-xl border border-white/10 hover:border-amber-400/50 hover:scale-[1.03] transition-all"
                            >
                              <div
                                className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[h.type]} opacity-80`}
                              />

                              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors" />

                              <div className="relative p-2 flex flex-col items-center gap-1">
                                <img
                                  src={
                                    h.img
                                  }
                                  alt={
                                    h.name
                                  }
                                  loading="lazy"
                                  className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/20"
                                />

                                <span className="text-white font-semibold text-[11px] text-center leading-tight drop-shadow line-clamp-1">
                                  {
                                    h.name
                                  }
                                </span>

                                <span
                                  className={`text-[8px] uppercase tracking-wider font-bold ${CLASS_TEXT[h.cls]} drop-shadow`}
                                >
                                  {
                                    h.cls
                                  }
                                </span>
                              </div>
                            </button>
                          )
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  TEAM ANALYSIS
                  ================================================= */}

              {(() => {
                const enemyHeroes =
                  picks
                    .map(
                      (id) =>
                        HEROES.find(
                          (h) =>
                            h.id ===
                            id
                        )!
                    )
                    .filter(Boolean);

                const myHeroesFinal =
                  editedHeroes.length ===
                  5
                    ? (editedHeroes as any)
                    : team.map(
                        (h) => h
                      );

                if (
                  enemyHeroes.length !==
                    5 ||
                  myHeroesFinal.length !==
                    5
                ) {
                  return null;
                }

                const sumStats = (
                  heroes: typeof enemyHeroes
                ) => {
                  const s = {
                    hp: 0,
                    atk: 0,
                    matk: 0,
                    def: 0,
                    mdef: 0,
                  };

                  for (const h of heroes) {
                    s.hp +=
                      h.stats.hp;
                    s.atk +=
                      h.stats.atk;
                    s.matk +=
                      h.stats.matk;
                    s.def +=
                      h.stats.def;
                    s.mdef +=
                      h.stats.mdef;
                  }

                  return s;
                };

                const enemySum =
                  sumStats(
                    enemyHeroes
                  );

                const mySum =
                  sumStats(
                    myHeroesFinal
                  );

                const classCount =
                  (
                    heroes: typeof enemyHeroes
                  ) => {
                    const counts: Record<
                      string,
                      number
                    > = {
                      STR: 0,
                      AGI: 0,
                      INT: 0,
                    };

                    for (const h of heroes) {
                      counts[
                        h.cls
                      ]++;
                    }

                    return counts;
                  };

                const enemyClasses =
                  classCount(
                    enemyHeroes
                  );

                const myClasses =
                  classCount(
                    myHeroesFinal
                  );

                const typeCount =
                  (
                    heroes: typeof enemyHeroes
                  ) => {
                    const counts: Record<
                      string,
                      number
                    > = {};

                    for (const h of heroes) {
                      counts[
                        h.type
                      ] =
                        (counts[
                          h.type
                        ] ?? 0) + 1;
                    }

                    return counts;
                  };

                const enemyTypes =
                  typeCount(
                    enemyHeroes
                  );

                const myTypes =
                  typeCount(
                    myHeroesFinal
                  );

                const OFFENSE_META:
                  {
                    key: keyof typeof enemySum;
                    label: string;
                    color: string;
                  }[] = [
                  {
                    key: "atk",
                    label: "ATK",
                    color: "#fbbf24",
                  },
                  {
                    key: "matk",
                    label: "MATK",
                    color: "#38bdf8",
                  },
                ];

                const DEFENSE_META:
                  {
                    key: keyof typeof enemySum;
                    label: string;
                    color: string;
                  }[] = [
                  {
                    key: "def",
                    label: "DEF",
                    color: "#10b981",
                  },
                  {
                    key: "mdef",
                    label: "MDEF",
                    color: "#6366f1",
                  },
                ];

                const PieChart = ({
                  data,
                  side,
                  meta,
                  title,
                }: {
                  data: typeof enemySum;
                  side:
                    | "enemy"
                    | "mine";
                  meta: typeof OFFENSE_META;
                  title: string;
                }) => {
                  const total =
                    meta.reduce(
                      (a, s) =>
                        a +
                        data[
                          s.key
                        ],
                      0
                    ) || 1;

                  let angle = -90;

                  const slices =
                    meta.map(
                      (s) => {
                        const value =
                          data[
                            s.key
                          ];

                        const pct =
                          value /
                          total;

                        const sweep =
                          pct *
                          360;

                        const start =
                          angle;

                        const end =
                          angle +
                          sweep;

                        angle = end;

                        const large =
                          sweep >
                          180
                            ? 1
                            : 0;

                        const r = 44;
                        const cx = 50;
                        const cy = 50;

                        const rad = (
                          d: number
                        ) =>
                          (d *
                            Math.PI) /
                          180;

                        const x1 =
                          cx +
                          r *
                            Math.cos(
                              rad(
                                start
                              )
                            );

                        const y1 =
                          cy +
                          r *
                            Math.sin(
                              rad(
                                start
                              )
                            );

                        const x2 =
                          cx +
                          r *
                            Math.cos(
                              rad(
                                end
                              )
                            );

                        const y2 =
                          cy +
                          r *
                            Math.sin(
                              rad(
                                end
                              )
                            );

                        return {
                          ...s,
                          value,
                          pct,
                          path: `M ${cx} ${cy} L ${x1.toFixed(
                            2
                          )} ${y1.toFixed(
                            2
                          )} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(
                            2
                          )} ${y2.toFixed(
                            2
                          )} Z`,
                        };
                      }
                    );

                  const ringColor =
                    side ===
                    "enemy"
                      ? "#fb7185"
                      : "#34d399";

                  return (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                        {title}
                      </span>

                      <svg
                        width="100"
                        height="100"
                        viewBox="0 0 100 100"
                        className="drop-shadow-lg"
                      >
                        {slices.map(
                          (
                            sl,
                            i
                          ) => (
                            <path
                              key={
                                i
                              }
                              d={
                                sl.path
                              }
                              fill={
                                sl.color
                              }
                              stroke="#0a0a0f"
                              strokeWidth="1.5"
                              className="transition-all duration-300 hover:opacity-80"
                            />
                          )
                        )}

                        <circle
                          cx="50"
                          cy="50"
                          r="24"
                          fill="#0a0a0f"
                          stroke={
                            ringColor
                          }
                          strokeWidth="1.5"
                          opacity="0.95"
                        />

                        <text
                          x="50"
                          y="54"
                          textAnchor="middle"
                          className="fill-white/60 text-[7px]"
                        >
                          {formatStat(
                            total
                          )}
                        </text>
                      </svg>

                      <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 max-w-[120px]">
                        {slices
                          .filter(
                            (s) =>
                              s.value >
                              0
                          )
                          .map(
                            (s) => (
                              <span
                                key={
                                  s.label
                                }
                                className="inline-flex items-center gap-1 text-[8px] text-white/70"
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      s.color,
                                  }}
                                />

                                {
                                  s.label
                                }

                                <span className="text-white/40">
                                  {Math.round(
                                    s.pct *
                                      100
                                  )}
                                  %
                                </span>
                              </span>
                            )
                          )}
                      </div>
                    </div>
                  );
                };

                const HpBar = ({
                  data,
                  side,
                  max,
                }: {
                  data: typeof enemySum;
                  side:
                    | "enemy"
                    | "mine";
                  max: number;
                }) => {
                  const color =
                    side ===
                    "enemy"
                      ? "from-rose-500 to-rose-400"
                      : "from-emerald-500 to-emerald-400";

                  const pct =
                    max > 0
                      ? (data.hp /
                          max) *
                        100
                      : 0;

                  return (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-rose-300/80">
                          PV
                        </span>

                        <span
                          className={`text-[10px] font-bold tabular-nums ${
                            side ===
                            "enemy"
                              ? "text-rose-300"
                              : "text-emerald-300"
                          }`}
                        >
                          {formatStat(
                            data.hp
                          )}
                        </span>
                      </div>

                      <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`}
                          style={{
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                };

                const ClassBadge = ({
                  cls,
                  count,
                }: {
                  cls: string;
                  count: number;
                  side:
                    | "enemy"
                    | "mine";
                }) => {
                  if (
                    count === 0
                  ) {
                    return null;
                  }

                  const color =
                    cls ===
                    "STR"
                      ? "text-rose-300 bg-rose-500/15 border-rose-500/25"
                      : cls ===
                        "AGI"
                      ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/25"
                      : "text-sky-300 bg-sky-500/15 border-sky-500/25";

                  return (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${color}`}
                    >
                      {cls}{" "}
                      <span className="text-white/60 font-normal">
                        ×{count}
                      </span>
                    </span>
                  );
                };

                return (
				
				

<div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
  <div className="flex items-center gap-2 mb-4">
    <Scale className="h-4 w-4 text-amber-400" />
    <span className="text-sm font-medium text-white/80">
      Analyse des équipes
    </span>
  </div>

  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-5">
    <span className="text-xs font-semibold text-white/70 text-right">
      Équipe ennemie
    </span>

    <span className="text-white/20 text-xs">
      VS
    </span>

    <span className="text-xs font-semibold text-white/70 text-left">
      Mon équipe
    </span>
  </div>

{/* =================================================
    COMPARAISON DES STATISTIQUES
    ================================================= */}

<div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">

  <div className="flex items-center gap-2 mb-4">
    <Scale className="h-4 w-4 text-amber-400" />

    <span className="text-sm font-medium text-white/80">
      Comparaison des statistiques
    </span>
  </div>

  <div className="space-y-3">

    {[
      {
        key: "atk",
        label: "ATTAQUE",
        enemy: enemySum.atk,
        mine: mySum.atk,
      },
      {
        key: "matk",
        label: "ATQ MAG",
        enemy: enemySum.matk,
        mine: mySum.matk,
      },
      {
        key: "def",
        label: "DÉFENSE",
        enemy: enemySum.def,
        mine: mySum.def,
      },
      {
        key: "mdef",
        label: "MDEF",
        enemy: enemySum.mdef,
        mine: mySum.mdef,
      },
      {
        key: "hp",
        label: "PV",
        enemy: enemySum.hp,
        mine: mySum.hp,
      },
    ].map((stat) => {

      const max = Math.max(
        stat.enemy,
        stat.mine,
        1
      );

      const enemyWidth =
        (stat.enemy / max) * 100;

      const mineWidth =
        (stat.mine / max) * 100;

      const enemyBetter =
        stat.enemy > stat.mine;

      const mineBetter =
        stat.mine > stat.enemy;

      return (
        <div
          key={stat.key}
          className="grid grid-cols-[1fr_55px_auto_55px_1fr] items-center gap-2"
        >

          {/* ================================
              BARRE ENNEMI
              ANCRÉE AU CENTRE
              ================================ */}

          <div className="flex justify-end">

            <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">

              <div
                className={`h-full rounded-full ${
                  enemyBetter
                    ? "bg-emerald-400"
                    : mineBetter
                    ? "bg-rose-400"
                    : "bg-white/30"
                }`}
                style={{
                  width: `${enemyWidth}%`,
                  marginLeft: "auto",
                }}
              />

            </div>

          </div>


          {/* ================================
              VALEUR ENNEMIE
              ================================ */}

          <span
            className={`text-right text-xs font-bold tabular-nums ${
              enemyBetter
                ? "text-emerald-300"
                : mineBetter
                ? "text-rose-300"
                : "text-white/70"
            }`}
          >
            {stat.enemy.toLocaleString("fr-FR")}
          </span>


          {/* ================================
              NOM STAT
              ================================ */}

          <span className="text-[9px] font-bold text-white/40 text-center whitespace-nowrap">
            {stat.label}
          </span>


          {/* ================================
              VALEUR MOI
              ================================ */}

          <span
            className={`text-left text-xs font-bold tabular-nums ${
              mineBetter
                ? "text-emerald-300"
                : enemyBetter
                ? "text-rose-300"
                : "text-white/70"
            }`}
          >
            {stat.mine.toLocaleString("fr-FR")}
          </span>


          {/* ================================
              BARRE MOI
              ANCRÉE AU CENTRE
              ================================ */}

          <div>

            <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">

              <div
                className={`h-full rounded-full ${
                  mineBetter
                    ? "bg-emerald-400"
                    : enemyBetter
                    ? "bg-rose-400"
                    : "bg-white/30"
                }`}
                style={{
                  width: `${mineWidth}%`,
                }}
              />

            </div>

          </div>

        </div>
      );
    })}

  </div>

</div>

</div>

              );
              })()}

{/* =================================================
    BEST WIN TEAM
    ================================================= */}

{/* =================================================
    BEST WIN TEAM
    ================================================= */}
{/* =================================================
    BEST WIN TEAM
    ================================================= */}

              {bestWinTeam && (
                <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-amber-300">
                    <Crown className="h-4 w-4" />

                    Équipe de contre ayant le plus gagné

                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {bestWinTeam.rate}%
                      de victoire

                      <span className="text-[10px] font-normal opacity-60">
                        (
                        {
                          bestWinTeam.count
                        }{" "}
                        combat
                        {bestWinTeam.count >
                        1
                          ? "s"
                          : ""}
                        )
                      </span>
                    </span>
                  </h3>

                  <div className="grid grid-cols-5 gap-2">
                    {bestWinTeam.ids.map(
                      (id) => {
                        const h =
                          HEROES.find(
                            (x) =>
                              x.id ===
                              id
                          );

                        if (!h)
                          return null;

                        return (
                          <button
                            key={
                              id
                            }
                            onClick={() =>
                              setEditedTeam(
                                bestWinTeam.ids
                              )
                            }
                            className="group relative rounded-xl overflow-hidden border border-amber-500/30 hover:border-amber-400/60 hover:scale-[1.03] transition-all"
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[h.type]} opacity-70`}
                            />

                            <div className="absolute inset-0 bg-black/30" />

                            <div className="relative p-2 flex flex-col items-center gap-1">
                              <img
                                src={
                                  h.img
                                }
                                alt={
                                  h.name
                                }
                                loading="lazy"
                                className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/20"
                              />

                              <span className="text-white font-semibold text-[11px] text-center leading-tight drop-shadow line-clamp-1">
                                {
                                  h.name
                                }
                              </span>

                              <span
                                className={`text-[8px] uppercase tracking-wider font-bold ${CLASS_TEXT[h.cls]} drop-shadow`}
                              >
                                {
                                  h.cls
                                }
                              </span>
                            </div>
                          </button>
                        );
                      }
                    )}
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
      )}

      {/* =================================================
          FILTERS
          ================================================= */}
<div className="flex flex-col gap-3 mb-5">

  {/* Recherche */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />

    <input
      value={query}
      onChange={(e) =>
        setQuery(e.target.value)
      }
      placeholder="Rechercher par nom ou alias..."
      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
    />
  </div>

  {/* Classement */}
  <div className="flex flex-wrap gap-2">
    {(
      [
        ["played", "Plus joués"],
        ["hp", "PV"],
        ["atk", "ATQ"],
        ["matk", "ATQ MAG"],
        ["def", "DEF"],
        ["mdef", "MDEF"],
      ] as const
    ).map(([value, label]) => (
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

  {/* Classes */}
  <div className="flex flex-wrap gap-2">
    {(
      ["All", ...CLASSES] as const
    ).map((c) => (
      <button
        key={c}
        onClick={() =>
          setActiveClass(c)
        }
        className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
          activeClass === c
            ? "bg-white text-black"
            : "bg-white/5 text-white/60 hover:bg-white/10"
        }`}
      >
        {c === "All"
          ? "Toutes classes"
          : c}
      </button>
    ))}
  </div>

</div>

        {/* =================================================
            ROSTER
            ================================================= */}

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
         {filtered.map((hero) => (
              <button
                key={hero.id}
                onClick={() => toggle(hero.id)}
                disabled={
                  full &&
                  !pickSet.has(hero.id)
                }
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
            )
          )}
        </div>

        {/* =================================================
            FOOTER
            ================================================= */}

        <footer className="mt-12 text-center text-xs text-white/30">
          Données des héros : Lords Mobile Wiki
          (Fandom). Les recommandations apprennent
          de tes combats enregistrés.
        </footer>
      </div>
    </div>
  );
}
