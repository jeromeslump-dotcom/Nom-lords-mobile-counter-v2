import { useMemo, useState } from "react";
import {
  Check,
  CheckSquare,
  Search,
  Settings,
  Square,
  X,
} from "lucide-react";
import { HEROES, HeroClass } from "../heroes";

export default function HeroManager({
  enabledIds,
  usage,
  onToggleHero,
  onEnableAll,
  onDisableAll,
  onClose,
}: {
  enabledIds: Set<string>;
  usage: Record<string, number>;
  onToggleHero: (id: string) => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [cls, setCls] =
    useState<HeroClass | "All">("All");
	const [sortBy, setSortBy] = useState<"played" | "hp" | "atk" | "matk" | "def" | "mdef">("played");

  const filtered = useMemo(() => {
    return HEROES.filter((h) => {
     
      if (
        cls !== "All" &&
        h.cls !== cls
      ) {
        return false;
      }

      if (
        q &&
        !h.name
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        !h.alias
          .toLowerCase()
          .includes(q.toLowerCase())
      ) {
        return false;
      }

      return true;
}).sort((a, b) => {
  const enabledA = enabledIds.has(a.id) ? 0 : 1;
  const enabledB = enabledIds.has(b.id) ? 0 : 1;

  if (enabledA !== enabledB) {
    return enabledA - enabledB;
  }

  if (sortBy === "hp") {
    return b.stats.hp - a.stats.hp;
  }

  if (sortBy === "atk") {
    return b.stats.atk - a.stats.atk;
  }

  if (sortBy === "matk") {
    return b.stats.matk - a.stats.matk;
  }

  if (sortBy === "def") {
    return b.stats.def - a.stats.def;
  }

  if (sortBy === "mdef") {
    return b.stats.mdef - a.stats.mdef;
  }

if (sortBy === "played") {
  return (
    (usage[b.id] ?? 0) -
      (usage[a.id] ?? 0) ||
    a.name.localeCompare(b.name)
  );
}

return a.name.localeCompare(b.name);

});
}, [q, cls, enabledIds, sortBy]);

  const enabledCount = enabledIds.size;
  const totalCount = HEROES.length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-[#11151c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-amber-400" />

                <h2 className="text-xl font-bold">
                  Gérer les héros
                </h2>
              </div>

              <p className="text-xs text-white/40 mt-1">
                Coche les héros disponibles dans ton
                roster. Les héros décochés ne seront plus
                proposés dans les sélections.
              </p>

              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20">
                <CheckSquare className="h-3.5 w-3.5 text-amber-400" />

                <span className="text-xs text-amber-300 font-semibold">
                  {enabledCount} / {totalCount} héros actifs
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={onEnableAll}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
            >
              <CheckSquare className="h-4 w-4" />
              Tout cocher
            </button>

            <button
              onClick={onDisableAll}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
            >
              <Square className="h-4 w-4" />
              Tout décocher
            </button>

            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />

              <input
                value={q}
                onChange={(e) =>
                  setQ(e.target.value)
                }
                placeholder="Rechercher un héros..."
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
              />
            </div>
          </div>
        </div>

        {/* Hero list */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-255px)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {HEROES.map((hero) => {
              const enabled =
                enabledIds.has(hero.id);

              return (
                <button
                  key={hero.id}
                  onClick={() =>
                    onToggleHero(hero.id)
                  }
                  className={`relative overflow-hidden rounded-2xl border text-left transition-all ${
                    enabled
                      ? "border-emerald-400/40 bg-emerald-500/[0.05]"
                      : "border-white/10 bg-black/20 opacity-50"
                  } hover:scale-[1.02]`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      TYPE_GRADIENT[hero.type]
                    } ${
                      enabled
                        ? "opacity-30"
                        : "opacity-10"
                    }`}
                  />

                  <div className="relative p-2.5">

                    {/* CARTE */}
                    <div className="aspect-square rounded-xl overflow-hidden relative bg-[#11151c]">

```
                    {/* CROIX SUPPRESSION EQUIPE RECOMMANDEE */}
                    <button
                      type="button"
                      onClick={() => hideRecommendedHero(hero.id)}
                      className="absolute top-2 right-2 z-20 h-7 w-7 rounded-full bg-black/70 border border-white/20 text-white/70 hover:text-white hover:bg-rose-500/80 hover:border-rose-400/60 flex items-center justify-center transition-all"
                      title="Retirer ce héros"
                      aria-label={`Retirer ${hero.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
```


                      <img
                        src={hero.img}
                        alt={hero.name}
                        loading="lazy"
                        className={`absolute inset-0 h-full w-full object-cover ${
                          enabled
                            ? ""
                            : "grayscale"
                        }`}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />

                      <span className="absolute bottom-2 left-2 right-2 text-center text-xs font-bold text-white drop-shadow-lg line-clamp-1">
                        {hero.name}
                      </span>

                      <span
                        className={`absolute top-2 right-2 h-5 w-5 rounded-md flex items-center justify-center ${
                          enabled
                            ? "bg-emerald-400 text-black"
                            : "bg-black/70 text-white/30"
                        }`}
                      >
                        {enabled ? (
                          <Check
                            className="h-3.5 w-3.5"
                            strokeWidth={3}
                          />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </span>
                    </div>

                    {/* PSEUDO */}
                    <div className="mt-1.5 text-center text-[10px] sm:text-xs font-semibold text-white/60 truncate">
                      {hero.alias}
                    </div>

                    {/* TYPE + CLASSE */}
                    <div className="mt-0.5 flex items-center justify-center gap-1">
                      <span
                        className={`inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-md bg-black/70 border border-white/20 text-[9px] font-black ${
                          TYPE_TEXT[hero.type]
                        }`}
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
                        className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-md bg-black/70 border border-white/20 text-[9px] font-black ${
                          CLASS_TEXT[hero.cls]
                        }`}
                        title={hero.cls}
                      >
                        {hero.cls}
                      </span>
                    </div>

                    {/* STATS */}
                    <div className="mt-1.5 grid grid-cols-5 gap-0.5">
                      <div className="rounded bg-black/35 px-0.5 py-1 text-center">
                        <div className="text-[7px] text-white/35">
                          PV
                        </div>
                        <div className="text-[8px] font-bold text-white/80">
                          {hero.stats.hp}
                        </div>
                      </div>

                      <div className="rounded bg-black/35 px-0.5 py-1 text-center">
                        <div className="text-[7px] text-white/35">
                          ATK
                        </div>
                        <div className="text-[8px] font-bold text-white/80">
                          {hero.stats.atk}
                        </div>
                      </div>

                      <div className="rounded bg-black/35 px-0.5 py-1 text-center">
                        <div className="text-[7px] text-white/35">
                          MATK
                        </div>
                        <div className="text-[8px] font-bold text-white/80">
                          {hero.stats.matk}
                        </div>
                      </div>

                      <div className="rounded bg-black/35 px-0.5 py-1 text-center">
                        <div className="text-[7px] text-white/35">
                          DEF
                        </div>
                        <div className="text-[8px] font-bold text-white/80">
                          {hero.stats.def}
                        </div>
                      </div>

                      <div className="rounded bg-black/35 px-0.5 py-1 text-center">
                        <div className="text-[7px] text-white/35">
                          MDEF
                        </div>
                        <div className="text-[8px] font-bold text-white/80">
                          {hero.stats.mdef}
                        </div>
                      </div>
                    </div>

                  </div>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-white/40 py-12 text-sm">
              Aucun héros ne correspond à ta recherche.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-[10px] text-white/30">
            La configuration est sauvegardée
            automatiquement dans Supabase.
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-amber-400 text-black text-xs font-bold hover:bg-amber-300"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
}
