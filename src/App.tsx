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
import { useHeroSelection } from "./hooks/useHeroSelection";
import { useCombatAnalytics } from "./hooks/useCombatAnalytics";
import { useAuth } from "./hooks/useAuth";
import { useCombatHistory } from "./hooks/useCombatHistory";
import { useManualCombat } from "./hooks/useManualCombat";

import { useEffect, useState } from "react";
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
  const [query, setQuery] =
    useState("");

  const {
    picks,
    setPicks,
    editedTeam,
    setEditedTeam,
    swapIndex,
    setSwapIndex,
    swapQuery,
    setSwapQuery,
    dragIndex,
    setDragIndex,
    dragOverIndex,
    setDragOverIndex,
    toggle,
    reorderPicks,
    reorderManual,
    resetSelection,
  } = useHeroSelection();
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
  enabledHeroIds,
  setEnabledHeroIds,
  heroPreferencesLoaded,
  toggleHeroEnabled,
  enableAllHeroes,
 } = useHeroPreferences(user);

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



  /* =======================================================
     ENABLED HEROES — SUPABASE
     ======================================================= */


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

  const {
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
  } = useCombatAnalytics({
    combats,
    picks,
    editedTeam,
    enabledHeroIds,
    activeClass,
    query,
    sortBy,
    showResult,
  });

  /* =======================================================
     LOGIN
     ======================================================= */
	 
  function reset() {
    resetSelection();
    setQuery("");
    setActiveClass("All");
    setShowResult(false);
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
                            toggle(hero.id, enabledHeroIds)
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
                onClick={() => toggle(hero.id, enabledHeroIds)}
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
