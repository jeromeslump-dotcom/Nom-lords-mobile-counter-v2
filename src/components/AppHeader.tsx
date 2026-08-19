import type React from "react";

import {
  Swords,
  History,
  Trophy,
  BookOpen,
  Settings,
} from "lucide-react";

import { HEROES } from "../heroes";

type AppHeaderProps = {
  appVersion: string;
  user: any;

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
  setShowManual: (value: boolean) => void;

  handleLogout: () => void;
};

export default function AppHeader({
  appVersion,
  user,
  combats,
  winCount,
  enabledHeroIds,
  loginError,
  setLoginError,
  setShowLogin,
  setShowHeroManager,
  setShowHistory,
  setShowManual,
  handleLogout,
}: AppHeaderProps) {
  return (
    <header className="mb-10">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.035] text-xs text-white/60 mb-4">
            <Swords className="h-3.5 w-3.5 text-amber-400" />

            <span>
              Lords Mobile Counter By Kikoine
            </span>

            <span className="text-white/30">
              •
            </span>

            <span className="text-amber-300/70">
              v{appVersion}
            </span>
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
              onClick={() =>
                setShowHeroManager(true)
              }
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
                  onClick={() =>
                    setShowHistory((v) => !v)
                  }
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
                  onClick={() =>
                    setShowManual(true)
                  }
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Ajouter un combat à
                  l'historique
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
  );
}