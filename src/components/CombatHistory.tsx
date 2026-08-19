import { Trash2, X } from "lucide-react";

import { HEROES } from "../heroes";

type Combat = {
  id: string;
  enemy_heroes: string[];
  my_heroes: string[];
  won: boolean;
  created_at: string;
};

type CombatHistoryProps = {
  combats: Combat[];
  loadingHistory: boolean;
  showHistory: boolean;
  setShowHistory: (value: boolean) => void;
  deleteCombat: (id: string) => void;
};

export default function CombatHistory({
  combats,
  loadingHistory,
  showHistory,
  setShowHistory,
  deleteCombat,
}: CombatHistoryProps) {
  if (!showHistory) {
    return null;
  }

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/80">
          Historique des combats
        </h3>

        <button
          onClick={() => setShowHistory(false)}
          className="text-white/40 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loadingHistory ? (
        <p className="text-center text-white/40 text-sm py-4">
          Chargement...
        </p>
      ) : combats.length === 0 ? (
        <p className="text-center text-white/40 text-sm py-4">
          Aucun combat enregistré.
          Clique sur « Enregistrer un combat passé »
          pour commencer.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {combats.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg bg-white/[0.035] border border-white/10 p-2"
            >

              {/* RESULTAT */}
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  c.won
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/20 text-rose-300"
                }`}
              >
                {c.won ? "VICTOIRE" : "DÉFAITE"}
              </span>

              {/* DATE */}
              <span className="text-[10px] text-white/40 whitespace-nowrap">
                {new Date(c.created_at).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "2-digit",
                    month: "short",
                  }
                )}

                {" · "}

                {new Date(c.created_at).toLocaleTimeString(
                  "fr-FR",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </span>

              {/* EQUIPES */}
              <div className="flex-1 min-w-0">

                {/* ENNEMIS */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-white/40">
                    Ennemis:
                  </span>

                  {c.enemy_heroes.map((id) => {
                    const h = HEROES.find(
                      (x) => x.id === id
                    );

                    return h ? (
                      <img
                        key={id}
                        src={h.img}
                        alt={h.name}
                        className="h-5 w-5 rounded object-cover"
                        title={h.name}
                      />
                    ) : null;
                  })}
                </div>

                {/* MON EQUIPE */}
                <div className="flex items-center gap-1 flex-wrap mt-1">
                  <span className="text-[10px] text-white/40">
                    Mon équipe:
                  </span>

                  {c.my_heroes.map((id) => {
                    const h = HEROES.find(
                      (x) => x.id === id
                    );

                    return h ? (
                      <img
                        key={id}
                        src={h.img}
                        alt={h.name}
                        className="h-5 w-5 rounded object-cover"
                        title={h.name}
                      />
                    ) : null;
                  })}
                </div>

              </div>

              {/* SUPPRESSION */}
              <button
                onClick={() => deleteCombat(c.id)}
                className="text-white/30 hover:text-rose-400 transition-colors p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}