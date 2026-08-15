
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { HEROES } from "../heroes";

const TYPE_GRADIENT: Record<string, string> = {
  Infantry: "from-red-900/80 to-red-500/20",
  Cavalry: "from-blue-900/80 to-blue-500/20",
  Ranged: "from-green-900/80 to-green-500/20",
  "Siege Engine": "from-purple-900/80 to-purple-500/20",
};

export default function HeroGridPicker({
  picks,
  onToggle,
  excludeIds = new Set<string>(),
  usage = {},
  enabledIds,
}: {
  picks: string[];
  onToggle: (id: string) => void;
  excludeIds?: Set<string>;
  usage?: Record<string, number>;
  enabledIds?: Set<string>;
}) {
  const [q, setQ] = useState("");

  const pickSet = useMemo(
    () => new Set(picks),
    [picks]
  );

  /*
   * Si App.tsx ne fournit pas enabledIds,
   * tous les héros présents dans HEROES sont considérés actifs.
   */
  const activeIds = useMemo(
    () =>
      enabledIds ??
      new Set(
        HEROES.map((hero) => hero.id)
      ),
    [enabledIds]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return HEROES.filter((h) => {
      if (!activeIds.has(h.id)) {
        return false;
      }

      if (excludeIds.has(h.id)) {
        return false;
      }

      if (
        query &&
        !h.name.toLowerCase().includes(query) &&
        !h.alias.toLowerCase().includes(query)
      ) {
        return false;
      }

      return true;
    }).sort(
      (a, b) =>
        (usage[b.id] ?? 0) -
          (usage[a.id] ?? 0) ||
        a.name.localeCompare(b.name)
    );
  }, [
    q,
    activeIds,
    excludeIds,
    usage,
  ]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />

          <input
            value={q}
            onChange={(e) =>
              setQ(e.target.value)
            }
            placeholder="Rechercher..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
        {filtered.map((h) => {
          const selected = pickSet.has(h.id);
          const order =
            picks.indexOf(h.id) + 1;

          return (
            <button
              key={h.id}
              type="button"
              onClick={() => onToggle(h.id)}
              className={`relative rounded-lg overflow-hidden border transition-all ${
                selected
                  ? "border-amber-400 ring-2 ring-amber-400/50"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  TYPE_GRADIENT[h.type] ??
                  "from-slate-900/80 to-slate-500/20"
                } opacity-70`}
              />

              <div className="absolute inset-0 bg-black/30" />

              <div className="relative p-1.5 flex flex-col items-center gap-0.5">
                <img
                  src={h.img}
                  alt={h.name}
                  loading="lazy"
                  className="h-10 w-10 rounded object-cover ring-1 ring-white/20"
                />

                <span className="text-[9px] text-white font-medium text-center line-clamp-1 drop-shadow">
                  {h.name}
                </span>
              </div>

              {selected && (
                <>
                  {/* Numéro d'ordre */}
                  <div className="absolute top-1 left-1 z-[60] h-6 w-6 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center shadow-xl pointer-events-none">
                    <span className="text-xs font-black text-black">
                      {order}
                    </span>
                  </div>

                  {/* Croix */}
                  <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-amber-400 flex items-center justify-center z-10">
                    <X
                      className="h-2.5 w-2.5 text-black"
                      strokeWidth={3}
                    />
                  </div>

                  {/* Contour sélection */}
                  <div className="absolute inset-0 rounded-lg ring-2 ring-amber-400/70 pointer-events-none z-10" />
                </>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-white/30 text-xs py-5">
          Aucun héros actif ne correspond.
        </p>
      )}
    </div>
  );
}
