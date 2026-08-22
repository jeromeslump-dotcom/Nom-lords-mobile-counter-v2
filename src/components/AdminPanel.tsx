import { useState } from "react";

import { Shield, Users, Swords, X, ArrowLeft } from "lucide-react";

import ManualCombatModal from "./ManualCombatModal";
import UserManagement from "./UserManagement";

type AdminPanelProps = {
  currentUserId: string;

  onClose: () => void;

  /* =========================================================
     MANUAL COMBAT
     ========================================================= */

  mEnemies: string[];
  mMine: string[];
  mWon: boolean;

  savingManual: boolean;

  setShowManual: (value: boolean) => void;

  saveManual: () => Promise<void>;
  mReady: boolean;

  setMEnemies: React.Dispatch<React.SetStateAction<string[]>>;

  setMMine: React.Dispatch<React.SetStateAction<string[]>>;

  setMWon: React.Dispatch<React.SetStateAction<boolean>>;

  usage: Record<string, number>;

  enabledHeroIds: Set<string>;
};

type AdminView = "menu" | "users" | "manual";

export default function AdminPanel({
  currentUserId,
  onClose,

  mEnemies,
  mMine,
  mWon,
  savingManual,

  setShowManual,

  saveManual,
  mReady,

  setMEnemies,
  setMMine,
  setMWon,

  usage,
  enabledHeroIds,
}: AdminPanelProps) {
  const [activeView, setActiveView] = useState<AdminView>("menu");

  /* =========================================================
     RETOUR AU MENU ADMIN
     ========================================================= */

  function goBack() {
    setActiveView("menu");
  }

  /* =========================================================
     OUVERTURE COMBAT
     ========================================================= */

  function openManualCombat() {
    setActiveView("manual");
  }

  /* =========================================================
     FERMETURE COMBAT
     ========================================================= */

  function closeManualCombat() {
    setActiveView("menu");
    setShowManual(false);
  }

  /* =========================================================
     MENU PRINCIPAL
     ========================================================= */

  if (activeView === "menu") {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111318] shadow-2xl overflow-hidden">
            {/* =================================================
                HEADER
                ================================================= */}

            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20">
                  <Shield className="h-5 w-5 text-amber-400" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">Admin Panel</h2>

                  <p className="text-xs text-white/40">
                    Gestion de l'application
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* =================================================
                MENU
                ================================================= */}

            <div className="p-5 space-y-3">
              {/* =================================================
                  GESTION UTILISATEURS
                  ================================================= */}

              <button
                onClick={() => setActiveView("users")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <Users className="h-4 w-4 text-amber-400" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm text-white">
                    Gestion des utilisateurs
                  </div>

                  <div className="text-[11px] text-white/30 mt-0.5">
                    Rechercher les utilisateurs et gérer leurs rôles
                  </div>
                </div>
              </button>

              {/* =================================================
                  ENREGISTRER COMBAT
                  ================================================= */}

              <button
                onClick={openManualCombat}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                  <Swords className="h-4 w-4 text-amber-400" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm text-white">
                    Enregistrer un combat passé
                  </div>

                  <div className="text-[11px] text-white/30 mt-0.5">
                    Ajouter un ancien combat à l'historique commun
                  </div>
                </div>
              </button>
            </div>

            {/* =================================================
                FOOTER
                ================================================= */}

            <div className="flex justify-end px-5 py-4 border-t border-white/10 bg-white/[0.02]">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     GESTION UTILISATEURS
     ========================================================= */

  if (activeView === "users") {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <UserManagement currentUserId={currentUserId} onClose={onClose} />

            {/* RETOUR */}

            <div className="flex justify-center mt-3">
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     ENREGISTRER UN COMBAT
     ========================================================= */

  if (activeView === "manual") {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <ManualCombatModal
              mEnemies={mEnemies}
              mMine={mMine}
              mWon={mWon}
              savingManual={savingManual}

              setShowManual={(value) => {
                if (!value) {
                  closeManualCombat();
                }
              }}

              saveManual={saveManual}
              mReady={mReady}

              setMEnemies={setMEnemies}
              setMMine={setMMine}
              setMWon={setMWon}

              usage={usage}
              enabledHeroIds={enabledHeroIds}
            />

            {/* RETOUR */}

            <div className="flex justify-center mt-3">
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour au Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
