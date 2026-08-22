import type React from "react";

import { Swords, History, Trophy, Settings, Shield } from "lucide-react";

import { HEROES } from "../heroes";

type AppHeaderProps = {
  appVersion: string;
  user: any;

  role: "user" | "contributor" | "admin" | null;

  isAdmin: boolean;
  isContributor: boolean;
  canManageHeroes: boolean;
  canAddCombat: boolean;

  combats: Array<{
    id: string;
    won: boolean;
    created_at: string;
  }>;

  winCount: number;

  enabledHeroIds: Set<string>;

  loginError: string;
  setLoginError: (value: string) => void;

  setShowLogin: (value: boolean) => void;
  setShowHeroManager: (value: boolean) => void;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAdminPanel: (value: boolean) => void;

  handleLogout: () => void;
};

export default function AppHeader({
  appVersion,
  user,
  role,
  isAdmin,
  isContributor,
  canManageHeroes,
  canAddCombat,
  combats,
  winCount,
  enabledHeroIds,
  loginError,
  setLoginError,
  setShowLogin,
  setShowHeroManager,
  setShowHistory,
  setShowAdminPanel,
  handleLogout,
}: AppHeaderProps) {
  return (
    <header className="mb-10">
      <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* =================================================
            LEFT SIDE
            ================================================= */}

        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.035] text-xs text-white/60 mb-4">
            <Swords className="h-3.5 w-3.5 text-amber-400" />

            <span>Lords Mobile Counter By Kikoine</span>

            <span className="text-white/30">•</span>

            <span className="text-amber-300/70">v{appVersion}</span>
          </div>
        </div>

        {/* =================================================
            CENTER TITLE
            ================================================= */}

        <div className="hidden lg:block absolute left-1/2 top-10 -translate-x-1/2 text-center pointer-events-none">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white whitespace-nowrap">
            Colisée des héros
          </h1>
        </div>

        {/* MOBILE TITLE */}

        <div className="lg:hidden text-center -mt-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Colisée des héros
          </h1>
        </div>

        {/* =================================================
            RIGHT SIDE
            ================================================= */}

        <div className="flex flex-col items-center lg:items-end gap-3">
          {/* =================================================
              AUTH
              ================================================= */}

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-xs text-emerald-300">Jérôme 👑</span>

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

          {/* =================================================
              USER ACTIONS
              ================================================= */}

          {user && (
            <>
              {/* =================================================
                  HERO MANAGEMENT
                  USER / CONTRIBUTOR / ADMIN
                  ================================================= */}

              {canManageHeroes && (
                <button
                  onClick={() => setShowHeroManager(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4 text-amber-400" />

                  <span>Gérer les héros actifs</span>

                  <span className="text-[10px] text-white/30">
                    {enabledHeroIds.size}/{HEROES.length}
                  </span>
                </button>
              )}

              {/* =================================================
                  COMMON HISTORY — ADMIN ONLY
                  ================================================= */}

              {isAdmin && (
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 transition-colors"
                >
                  <History className="h-4 w-4" />
                  {combats.length} combat
                  {combats.length > 1 ? "s" : ""}
                  <span className="text-white/30">·</span>
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  {winCount} victoires
                </button>
              )}

              {/* =================================================
                  ADMIN PANEL — ADMIN ONLY
                  ================================================= */}

              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 hover:bg-amber-500/20 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
