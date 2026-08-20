import AppHeader from "./components/AppHeader";
import LoginModal from "./components/LoginModal";
import EnemySlots from "./components/EnemySlots";
import HeroRoster from "./components/HeroRoster";
import HeroManager from "./components/HeroManager";
import HeroFilters from "./components/HeroFilters";
import CombatHistory from "./components/CombatHistory";
import RecommendedTeam from "./components/RecommendedTeam";
import ManualCombatModal from "./components/ManualCombatModal";

import { useAuth } from "./hooks/useAuth";
import { useAppUI } from "./hooks/useAppUI";
import { useManualCombat } from "./hooks/useManualCombat";
import { useHeroSelection } from "./hooks/useHeroSelection";
import { useCombatHistory } from "./hooks/useCombatHistory";
import { useHeroManagement } from "./hooks/useHeroManagement";
import { useHeroPreferences } from "./hooks/useHeroPreferences";
import { useCombatAnalytics } from "./hooks/useCombatAnalytics";

import {
  HEROES,
  formatStat,
} from "./heroes";

import {
  RotateCcw,
  Swords,
  X,
  ArrowLeftRight,
} from "lucide-react";

import "./App.css";

const MAX_PICKS = 5;
const APP_VERSION = "2.1.0";

/* =========================================================
   APP
   ========================================================= */

export default function App() {

  /* =======================================================
     HERO SELECTION
     ======================================================= */

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

  /* =======================================================
     APP UI
     ======================================================= */

  const {
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
  } = useAppUI(resetSelection);

  /* =======================================================
     AUTH
     ======================================================= */

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

  /* =======================================================
     COMBAT HISTORY
     ======================================================= */

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

  /* =======================================================
     HERO PREFERENCES
     ======================================================= */

  const {
    enabledHeroIds,
    setEnabledHeroIds,
    heroPreferencesLoaded,
    toggleHeroEnabled,
    enableAllHeroes,
  } = useHeroPreferences(user);

  /* =======================================================
     MANUAL COMBAT
     ======================================================= */

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

  /* =======================================================
     HERO MANAGEMENT
     ======================================================= */

  const {
    disableAllHeroes,
  } = useHeroManagement({
    enabledHeroIds,
    setEnabledHeroIds,
    setPicks,
    setEditedTeam,
    setMEnemies,
    setMMine,
    setShowResult,
  });

  /* =======================================================
     COMBAT ANALYTICS
     ======================================================= */

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
  enemyStats,
  teamStats,
  statComparisons,
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
     OTHER
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
          enabledIds={enabledHeroIds}
          usage={usage}
          onToggleHero={toggleHeroEnabled}
          onEnableAll={enableAllHeroes}
          onDisableAll={disableAllHeroes}
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

        {user && (
          <CombatHistory
            combats={combats}
            loadingHistory={loadingHistory}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            deleteCombat={deleteCombat}
          />
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
            ENEMY SLOTS
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

        {full && !showResult && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => {
                setEditedTeam(
                  team
                    .map((h) => h.id)
                    .filter((id) =>
                      enabledHeroIds.has(id)
                    )
                );

                setHiddenRecommendedIds(
                  new Set()
                );

                setShowResult(true);
              }}
              className="px-8 py-3 rounded-xl bg-amber-400 text-black font-bold shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
            >
              Trouver la meilleure contre
            </button>
          </div>
        )}
		
{showResult && editedHeroes.length > 0 && (
  <RecommendedTeam
    report={report}
    editedHeroes={editedHeroes}
    editedTeam={editedTeam}
    setEditedTeam={setEditedTeam}
	  enemyStats={enemyStats}
  teamStats={teamStats}
  statComparisons={statComparisons}

    hiddenRecommendedIds={hiddenRecommendedIds}
    hideRecommendedHero={hideRecommendedHero}
    setHiddenRecommendedIds={setHiddenRecommendedIds}

    swapIndex={swapIndex}
    setSwapIndex={setSwapIndex}
    swapQuery={swapQuery}
    setSwapQuery={setSwapQuery}

    usage={usage}
    enabledHeroIds={enabledHeroIds}

    winRate={winRate}
    bestWinTeam={bestWinTeam}

    recordCombat={recordCombat}
    recording={recording}

    reset={reset}
  />
)}

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
            HERO ROSTER
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