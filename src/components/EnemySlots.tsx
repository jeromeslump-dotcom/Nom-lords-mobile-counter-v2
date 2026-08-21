import { RotateCcw, Swords, X } from "lucide-react";

import { HEROES, TYPE_TEXT, CLASS_TEXT } from "../heroes";

type EnemySlotsProps = {
  picks: string[];
  maxPicks: number;
  dragIndex: number | null;
  dragOverIndex: number | null;
  setDragIndex: (index: number | null) => void;
  setDragOverIndex: (index: number | null) => void;
  reorderPicks: (fromIndex: number, toIndex: number) => void;
  toggle: (heroId: string, enabledHeroIds: Set<string>) => void;
  enabledHeroIds: Set<string>;
  reset: () => void;
};

export default function EnemySlots({
  picks,
  maxPicks,
  dragIndex,
  dragOverIndex,
  setDragIndex,
  setDragOverIndex,
  reorderPicks,
  toggle,
  enabledHeroIds,
  reset,
}: EnemySlotsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-amber-400" />

          <span className="text-xl font-bold text-white/80">
            Équipe ennemie{" "}
            <span className="text-white/40">
              ({picks.length}/{maxPicks})
            </span>
          </span>
        </div>

        {picks.length > 0 && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Effacer tout
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-[720px] mx-auto">
        {Array.from({ length: maxPicks }).map((_, i) => {
          const id = picks[i];

          const hero = id ? HEROES.find((h) => h.id === id) : null;

          return (
            <div
              key={i}
              draggable={!!hero}
              onDragStart={() => setDragIndex(i)}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(i);
              }}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== i && picks[dragIndex]) {
                  reorderPicks(dragIndex, i);
                }

                setDragIndex(null);
                setDragOverIndex(null);
              }}
              className={`transition-all ${
                dragOverIndex === i && dragIndex !== null && dragIndex !== i
                  ? "ring-2 ring-cyan-400/60 scale-105 rounded-2xl"
                  : ""
              } ${dragIndex === i ? "opacity-40" : ""}`}
            >
              {hero ? (
                <>
                  <div className="aspect-square rounded-2xl border border-amber-400/50 overflow-hidden relative cursor-grab active:cursor-grabbing">
                    <img
                      src={hero.img}
                      alt={hero.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" />

                    <button
                      onClick={() => toggle(hero.id, enabledHeroIds)}
                      className="hero-remove-button absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 hover:bg-rose-500 flex items-center justify-center transition-colors z-10"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>

                    <span className="absolute bottom-2 left-2 right-2 text-xs sm:text-sm font-bold text-center drop-shadow-lg line-clamp-1">
                      {hero.name}
                    </span>
                  </div>

                  <div className="mt-1.5 text-center text-[11px] sm:text-xs font-semibold text-white/75 truncate">
                    {hero.alias}
                  </div>

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
  );
}
