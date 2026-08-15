import { useState } from "react";
import { X } from "lucide-react";
import { HEROES } from "../heroes";

const MAX_PICKS = 5;

const CLASS_TEXT: Record<string, string> = {
  STR: "text-red-300",
  AGI: "text-green-300",
  INT: "text-blue-300",
};

export default function HeroSlots({
  picks,
  onRemove,
  onReorder,
  label,
  color,
}: {
  picks: string[];
  onRemove: (id: string) => void;
  onReorder?: (from: number, to: number) => void;
  label: string;
  color: string;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function handleDrop(to: number) {
    if (
      dragIdx !== null &&
      dragIdx !== to &&
      onReorder &&
      picks[dragIdx]
    ) {
      onReorder(dragIdx, to);
    }

    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <div>
      <div className="text-xs text-white/50 mb-1.5">
        {label} ({picks.length}/{MAX_PICKS})
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: MAX_PICKS }).map((_, i) => {
          const id = picks[i];
          const hero = id
            ? HEROES.find((h) => h.id === id)
            : null;

          const draggable = !!hero && !!onReorder;

          return (
            <div
              key={i}
              draggable={draggable}
              onDragStart={() => setDragIdx(i)}
              onDragEnd={() => {
                setDragIdx(null);
                setOverIdx(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIdx(i);
              }}
              onDrop={() => handleDrop(i)}
              className={`aspect-square rounded-lg border overflow-hidden relative transition-all ${
                hero
                  ? "border-amber-400/40"
                  : "border-dashed border-white/15 bg-white/[0.02]"
              } ${
                draggable
                  ? "cursor-grab active:cursor-grabbing"
                  : ""
              } ${
                overIdx === i &&
                dragIdx !== null &&
                dragIdx !== i
                  ? "ring-2 ring-cyan-400/60 scale-105"
                  : ""
              } ${
                dragIdx === i
                  ? "opacity-40"
                  : ""
              }`}
            >
              {hero ? (
                <>
                  <img
                    src={hero.img}
                    alt={hero.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />

                  <button
                    onClick={() => onRemove(hero.id)}
                    className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/70 hover:bg-rose-500 flex items-center justify-center transition-colors z-10"
                  >
                    <X className="h-2.5 w-2.5 text-white" />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 px-0.5 pb-0.5 text-center">
                    <span className="text-[8px] font-semibold drop-shadow leading-tight line-clamp-1 block">
                      {hero.name}
                    </span>

                    <span
                      className={`text-[7px] font-bold drop-shadow ${CLASS_TEXT[hero.cls]}`}
                    >
                      {hero.cls}
                    </span>
                  </div>
                </>
              ) : (
                <span className={`text-sm ${color}`}>
                  {i + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
