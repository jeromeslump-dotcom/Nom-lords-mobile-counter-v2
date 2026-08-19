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

import HeroManager from "./components/HeroManager";
import ManualCombatModal from "./components/ManualCombatModal";
import HeroSlots from "./components/HeroSlots";
import HeroGridPicker from "./components/HeroGridPicker";
import LoginModal from "./components/LoginModal";
import EnemySlots from "./components/EnemySlots";
import AppHeader from "./components/AppHeader";

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

<AppHeader
  appVersion={APP_VERSION}
  user={user}
  combats={combats}
  winCount={winCount}
  enabledHeroIds={enabledHeroIds}
  loginError={loginError}
  setLoginError={setLoginError}
  setShowLogin={setShowLogin}
  setShowHeroManager={setShowHeroManager}
  setShowHistory={setShowHistory}
  setShowManual={setShowManual}
  handleLogout={handleLogout}
/>

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

<EnemySlots
  picks={picks}
  maxPicks={MAX_PICKS}
  dragIndex={dragIndex}
  dragOverIndex={dragOverIndex}
  setDragIndex={setDragIndex}
  setDragOverIndex={setDragOverIndex}
  reorderPicks={reorderPicks}
  toggle={toggle}
  enabledHeroIds={enabledHeroIds}
  reset={reset}
/>

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

<HeroFilters
  query={query}
  setQuery={setQuery}
  sortBy={sortBy}
  setSortBy={setSortBy}
  activeClass={activeClass}
  setActiveClass={setActiveClass}
/>


{/* =================================================
    ROSTER
    ================================================= */}

<HeroRoster
  filtered={filtered}
  pickSet={pickSet}
  picks={picks}
  full={full}
  enabledHeroIds={enabledHeroIds}
  toggle={toggle}
/>
      

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
