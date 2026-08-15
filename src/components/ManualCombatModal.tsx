import { BookOpen, X } from "lucide-react";

export default function ManualCombatModal({
  mEnemies,
  mMine,
  mWon,
  savingManual,
  setShowManual,
  toggleManual,
  saveManual,
  mReady,
}: {
  mEnemies: string[];
  mMine: string[];
  mWon: boolean | null;
  savingManual: boolean;
  setShowManual: (value: boolean) => void;
  toggleManual: (id: string, side: "enemy" | "mine") => void;
  saveManual: () => void;
  mReady: boolean;
}) {
  return (
<div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() =>
              setShowManual(false)
            }
          >
            <div
              className="bg-[#11151c] border border-white/10 rounded-2xl p-5 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-400" />
                  Enregistrer un combat passé
                </h2>

                <button
                  onClick={() =>
                    setShowManual(false)
                  }
                  className="text-white/40 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-white/50 mb-5">
                Renseigne les équipes et le résultat
                d'un combat déjà joué pour améliorer
                les recommandations.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* ENEMY */}
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-rose-400" />

                    <span className="text-sm font-semibold text-rose-300">
                      Équipe ennemie
                    </span>
                  </div>

                  <HeroSlots
                    picks={
                      mEnemies
                    }
                    onRemove={(id) =>
                      setMEnemies(
                        mEnemies.filter(
                          (p) =>
                            p !== id
                        )
                      )
                    }
                    onReorder={(
                      from,
                      to
                    ) =>
                      reorderManual(
                        mEnemies,
                        setMEnemies,
                        from,
                        to
                      )
                    }
                    label="Équipe ennemie"
                    color="text-rose-400/40"
                  />

                  <div className="mt-4">
                    <HeroGridPicker
                      picks={
                        mEnemies
                      }
                      onToggle={(id) =>
                        toggleManual(
                          mEnemies,
                          setMEnemies,
                          id
                        )
                      }
                      excludeIds={
                        new Set()
                      }
                      usage={usage}
                      enabledIds={
                        enabledHeroIds
                      }
                    />
                  </div>
                </div>

                {/* MINE */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Swords className="h-4 w-4 text-emerald-400" />

                    <span className="text-sm font-semibold text-emerald-300">
                      Mon équipe
                    </span>
                  </div>

                  <HeroSlots
                    picks={
                      mMine
                    }
                    onRemove={(id) =>
                      setMMine(
                        mMine.filter(
                          (p) =>
                            p !== id
                        )
                      )
                    }
                    onReorder={(
                      from,
                      to
                    ) =>
                      reorderManual(
                        mMine,
                        setMMine,
                        from,
                        to
                      )
                    }
                    label="Mon équipe"
                    color="text-emerald-400/40"
                  />

                  <div className="mt-4">
                    <HeroGridPicker
                      picks={
                        mMine
                      }
                      onToggle={(id) =>
                        toggleManual(
                          mMine,
                          setMMine,
                          id
                        )
                      }
                      excludeIds={
                        new Set()
                      }
                      usage={usage}
                      enabledIds={
                        enabledHeroIds
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-5 mt-5">
                <div className="text-xs text-white/50 mb-2">
                  Résultat
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setMWon(true)
                    }
                    className={`flex-1 px-4 py-2.5 rounded-xl font-semibold border transition-colors ${
                      mWon === true
                        ? "bg-emerald-500/30 border-emerald-500/60 text-emerald-300"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <Trophy className="inline h-4 w-4 mr-1" />
                    Victoire
                  </button>

                  <button
                    onClick={() =>
                      setMWon(false)
                    }
                    className={`flex-1 px-4 py-2.5 rounded-xl font-semibold border transition-colors ${
                      mWon === false
                        ? "bg-rose-500/30 border-rose-500/60 text-rose-300"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    Défaite
                  </button>
                </div>
              </div>

              <button
                onClick={
                  saveManual
                }
                disabled={
                  !mReady ||
                  savingManual
                }
                className="w-full mt-5 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
              >
                {savingManual
                  ? "Enregistrement..."
                  : "Enregistrer ce combat"}
              </button>
            </div>
          </div>
  );
}
