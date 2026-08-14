

import { useEffect, useMemo, useState } from "react";
import {
  RotateCcw,
  Search,
  Swords,
  Target,
  X,
  History,
  Trophy,
  Plus,
  Trash2,
  BookOpen,
  ArrowLeftRight,
  Crown,
  Shield,
  Scale,
  Settings,
  Check,
  CheckSquare,
  Square,
} from "lucide-react";

import {
  HEROES,
  CLASSES,
  HeroClass,
  TYPE_GRADIENT,
  TYPE_TEXT,
  CLASS_TEXT,
  formatStat,
} from "./heroes";

import {
  coverageReport,
  recommendTeam,
} from "./counter";

import type { Combat } from "./storage";

import {
  loadCombats,
  addCombat,
  removeCombat,
  signIn,
  signOut,
  getCurrentUser,
} from "./storage";

const MAX_PICKS = 5;
const HERO_SETTINGS_KEY = "lords-mobile-counter-v2-enabled-heroes";
const APP_VERSION = "2.0.1";



/* =========================================================
   HERO GRID PICKER
   ========================================================= */

function HeroGridPicker({
  picks,
  onToggle,
  excludeIds,
  usage,
  enabledIds,
}: {
  picks: string[];
  onToggle: (id: string) => void;
  excludeIds: Set<string>;
  usage: Record<string, number>;
  enabledIds: Set<string>;
}) {
  const [q, setQ] = useState("");

  const pickSet = useMemo(() => new Set(picks), [picks]);

  const filtered = HEROES.filter((h) => {
    if (!enabledIds.has(h.id)) return false;
    if (excludeIds.has(h.id)) return false;

    if (
      q &&
      !h.name.toLowerCase().includes(q.toLowerCase()) &&
      !h.alias.toLowerCase().includes(q.toLowerCase())
    ) {
      return false;
    }

    return true;
  }).sort(
    (a, b) =>
      (usage[b.id] ?? 0) - (usage[a.id] ?? 0) ||
      a.name.localeCompare(b.name)
  );

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
          />
        </div>

      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
        {filtered.map((h) => (
          <button
            key={h.id}
            onClick={() => onToggle(h.id)}
            className={`relative rounded-lg overflow-hidden border transition-all ${
              pickSet.has(h.id)
                ? "border-amber-400 ring-2 ring-amber-400/50"
                : "border-white/10 hover:border-white/30"
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[h.type]} opacity-70`}
            />

            <div className="absolute inset-0 bg-black/40" />

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

            {pickSet.has(h.id) && (
              <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-amber-400 flex items-center justify-center">
                <X
                  className="h-2.5 w-2.5 text-black"
                  strokeWidth={3}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-white/30 text-xs py-5">
          Aucun héros actif ne correspond.
        </p>
      )}
    </div>
  );
}

/* =========================================================
   HERO SLOTS
   ========================================================= */

function HeroSlots({
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

/* =========================================================
   HERO MANAGEMENT MODAL
   ========================================================= */

function HeroManager({
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
        className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-[#11111d] shadow-2xl"
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
{HEROES
  .map((hero) => {
              const enabled =
                enabledIds.has(hero.id);

              return (
                <button
                  key={hero.id}
                  onClick={() =>
                    onToggleHero(hero.id)
                  }
                  className={`relative overflow-hidden rounded-xl border text-left transition-all ${
                    enabled
                      ? "border-emerald-400/40 bg-emerald-500/[0.05]"
                      : "border-white/10 bg-black/20 opacity-50"
                  } hover:scale-[1.02]`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[hero.type]} ${
                      enabled
                        ? "opacity-40"
                        : "opacity-10"
                    }`}
                  />

                  <div className="relative p-2.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={hero.img}
                        alt={hero.name}
                        loading="lazy"
                        className={`h-11 w-11 rounded-lg object-cover ring-1 ${
                          enabled
                            ? "ring-emerald-400/40"
                            : "ring-white/10 grayscale"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {hero.name}
                          </span>

                          <span
                            className={`shrink-0 h-5 w-5 rounded-md flex items-center justify-center ${
                              enabled
                                ? "bg-emerald-400 text-black"
                                : "bg-white/10 text-white/30"
                            }`}
                          >
                            {enabled ? (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 mt-1">
                          <span
                            className={`text-[8px] font-bold ${CLASS_TEXT[hero.cls]}`}
                          >
                            {hero.cls}
                          </span>

                          <span className="text-white/20">
                            ·
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-[9px] text-white/40 truncate">
                      {hero.alias}
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
            automatiquement sur cet appareil.
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

/* =========================================================
   APP
   ========================================================= */

export default function App() {
  const [picks, setPicks] =
    useState<string[]>([]);

  const [query, setQuery] =
    useState("");

  const [user, setUser] =
    useState<any>(null);

  const [loginEmail, setLoginEmail] =
    useState("");

  const [loginPassword, setLoginPassword] =
    useState("");

  const [loginError, setLoginError] =
    useState("");

  const [showLogin, setShowLogin] =
    useState(false);

  const [loggingIn, setLoggingIn] =
    useState(false);

  const [activeClass, setActiveClass] =
    useState<HeroClass | "All">("All");
	
	const [sortBy, setSortBy] =
  useState<
    "played" | "hp" | "atk" | "matk" | "def" | "mdef"
  >("played");

  const [showResult, setShowResult] =
    useState(false);

  const [combats, setCombats] =
    useState<Combat[]>([]);

  const [loadingHistory, setLoadingHistory] =
    useState(true);

  const [recording, setRecording] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [showManual, setShowManual] =
    useState(false);

  const [showHeroManager, setShowHeroManager] =
    useState(false);

  const [editedTeam, setEditedTeam] =
    useState<string[]>([]);

  const [swapIndex, setSwapIndex] =
    useState<number | null>(null);

  const [swapQuery, setSwapQuery] =
    useState("");

  const [dragIndex, setDragIndex] =
    useState<number | null>(null);

  const [dragOverIndex, setDragOverIndex] =
    useState<number | null>(null);

  /* =======================================================
     ENABLED HEROES
     ======================================================= */

  const [enabledHeroIds, setEnabledHeroIds] =
    useState<Set<string>>(
      () => {
        try {
          const saved =
            localStorage.getItem(
              HERO_SETTINGS_KEY
            );

          if (!saved) {
            return new Set(
              HEROES.map((h) => h.id)
            );
          }

          const parsed =
            JSON.parse(saved);

          if (
            !Array.isArray(parsed)
          ) {
            return new Set(
              HEROES.map((h) => h.id)
            );
          }

          const validIds =
            parsed.filter((id) =>
              HEROES.some(
                (h) => h.id === id
              )
            );

          return new Set(validIds);
        } catch {
          return new Set(
            HEROES.map((h) => h.id)
          );
        }
      }
    );

  /* Sauvegarde automatique */
  useEffect(() => {
    try {
      localStorage.setItem(
        HERO_SETTINGS_KEY,
        JSON.stringify(
          Array.from(enabledHeroIds)
        )
      );
    } catch (error) {
      console.error(
        "Impossible de sauvegarder la configuration des héros.",
        error
      );
    }
  }, [enabledHeroIds]);

  /* =======================================================
     USER
     ======================================================= */

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    async function loadHistory() {
      if (!user) {
        setCombats([]);
        setLoadingHistory(false);
        return;
      }

      const loaded =
        await loadCombats();

      setCombats(
        Array.isArray(loaded)
          ? loaded
          : []
      );

      setLoadingHistory(false);
    }

    loadHistory();
  }, [user]);

  /* =======================================================
     CLEAN DISABLED HEROES FROM CURRENT SELECTIONS
     ======================================================= */

  useEffect(() => {
    setPicks((prev) =>
      prev.filter((id) =>
        enabledHeroIds.has(id)
      )
    );

    setEditedTeam((prev) =>
      prev.filter((id) =>
        enabledHeroIds.has(id)
      )
    );

    setMEnemies((prev) =>
      prev.filter((id) =>
        enabledHeroIds.has(id)
      )
    );

    setMMine((prev) =>
      prev.filter((id) =>
        enabledHeroIds.has(id)
      )
    );
  }, [enabledHeroIds]);

  /* =======================================================
     HERO MANAGEMENT
     ======================================================= */

  function toggleHeroEnabled(id: string) {
    setEnabledHeroIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function enableAllHeroes() {
    setEnabledHeroIds(
      new Set(
        HEROES.map((h) => h.id)
      )
    );
  }

  function disableAllHeroes() {
    setEnabledHeroIds(new Set());
    setPicks([]);
    setEditedTeam([]);
    setMEnemies([]);
    setMMine([]);
    setShowResult(false);
  }

  /* =======================================================
     DERIVED DATA
     ======================================================= */

  const pickSet =
    useMemo(
      () => new Set(picks),
      [picks]
    );

  const full =
    picks.length === MAX_PICKS;

  const usage =
    useMemo(() => {
      const counts: Record<
        string,
        number
      > = {};

      for (const c of combats) {
        for (const id of c.enemy_heroes) {
          counts[id] =
            (counts[id] ?? 0) + 1;
        }

        for (const id of c.my_heroes) {
          counts[id] =
            (counts[id] ?? 0) + 1;
        }
      }

      return counts;
    }, [combats]);

const filtered = useMemo(() => {
  return HEROES
    .filter((h) => {
      if (!enabledHeroIds.has(h.id)) {
        return false;
      }

      if (
        activeClass !== "All" &&
        h.cls !== activeClass
      ) {
        return false;
      }

      if (
        query &&
        !h.name
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        !h.alias
          .toLowerCase()
          .includes(query.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
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

      return (
        (usage[b.id] ?? 0) -
        (usage[a.id] ?? 0)
      );
    });
}, [
  query,
  activeClass,
  enabledHeroIds,
  usage,
  sortBy,
]);

const team =
  useMemo(
    () =>
      full
        ? recommendTeam(
            picks,
            combats
          )
        : [],
    [picks, full, combats]
  );

  const editedHeroes =
    useMemo(
      () =>
        editedTeam
          .map((id) =>
            HEROES.find(
              (h) => h.id === id
            )
          )
          .filter(Boolean),
      [editedTeam]
    );

  const report =
    useMemo(
      () =>
        full &&
        showResult &&
        editedHeroes.length === 5
          ? coverageReport(
              editedHeroes as any,
              picks
            )
          : [],
      [
        editedHeroes,
        picks,
        full,
        showResult,
      ]
    );

  const totalCoverage =
    report.reduce(
      (acc, r) =>
        acc + r.targets.length,
      0
    );

  /* =======================================================
     BEST HISTORICAL TEAM
     ======================================================= */

  const bestWinTeam =
    useMemo(() => {
      if (
        !full ||
        !showResult ||
        combats.length === 0
      ) {
        return null;
      }

      const relevant =
        combats.filter(
          (c) =>
            c.enemy_heroes.filter(
              (id) =>
                picks.includes(id)
            ).length === 5
        );

      if (
        relevant.length === 0
      ) {
        return null;
      }

      const teamMap =
        new Map<
          string,
          {
            wins: number;
            total: number;
          }
        >();

      for (const c of relevant) {
        const key = [
          ...c.my_heroes,
        ]
          .sort()
          .join(",");

        const entry =
          teamMap.get(key) ?? {
            wins: 0,
            total: 0,
          };

        entry.total++;

        if (c.won) {
          entry.wins++;
        }

        teamMap.set(
          key,
          entry
        );
      }

      let best:
        | {
            ids: string[];
            rate: number;
            count: number;
          }
        | null = null;

      for (const [
        key,
        entry,
      ] of teamMap) {
        if (
          entry.total < 2
        ) {
          continue;
        }

        const rate =
          Math.round(
            (entry.wins /
              entry.total) *
              100
          );

        if (
          !best ||
          rate > best.rate ||
          (rate === best.rate &&
            entry.total >
              best.count)
        ) {
          best = {
            ids: key.split(","),
            rate,
            count: entry.total,
          };
        }
      }

      if (!best) {
        return null;
      }

      const currentKey = [
        ...(editedTeam.length === 5
          ? editedTeam
          : team.map(
              (h) => h.id
            )),
      ]
        .sort()
        .join(",");

      if (
        [...best.ids]
          .sort()
          .join(",") ===
        currentKey
          .split(",")
          .sort()
          .join(",")
      ) {
        return null;
      }

      return best;
    }, [
      combats,
      picks,
      full,
      showResult,
      editedTeam,
      team,
    ]);

  /* =======================================================
     WIN RATE
     ======================================================= */

  const winRate =
    useMemo(() => {
      if (
        !full ||
        !showResult
      ) {
        return null;
      }

      const teamIds =
        editedTeam.length === 5
          ? editedTeam
          : team.map(
              (h) => h.id
            );

      const teamMatched =
        combats.filter(
          (c) => {
            const enemyOverlap =
              c.enemy_heroes.filter(
                (id) =>
                  picks.includes(id)
              ).length;

            const myOverlap =
              c.my_heroes.filter(
                (id) =>
                  teamIds.includes(
                    id
                  )
              ).length;

            return (
              enemyOverlap >= 4 &&
              myOverlap >= 4
            );
          }
        );

      if (
        teamMatched.length > 0
      ) {
        const wins =
          teamMatched.filter(
            (c) => c.won
          ).length;

        return {
          rate: Math.round(
            (wins /
              teamMatched.length) *
              100
          ),
          count:
            teamMatched.length,
        };
      }

      const enemyMatched =
        combats.filter(
          (c) =>
            c.enemy_heroes.filter(
              (id) =>
                picks.includes(id)
            ).length >= 4
        );

      if (
        enemyMatched.length ===
        0
      ) {
        return null;
      }

      const wins =
        enemyMatched.filter(
          (c) => c.won
        ).length;

      return {
        rate: Math.round(
          (wins /
            enemyMatched.length) *
            100
        ),
        count:
          enemyMatched.length,
      };
    }, [
      combats,
      picks,
      full,
      showResult,
      editedTeam,
      team,
    ]);

  /* =======================================================
     LOGIN
     ======================================================= */

  async function handleLogin() {
    if (
      !loginEmail ||
      !loginPassword
    ) {
      setLoginError(
        "Veuillez saisir votre email et votre mot de passe."
      );
      return;
    }

    setLoggingIn(true);
    setLoginError("");

    const {
      data,
      error,
    } = await signIn(
      loginEmail,
      loginPassword
    );

    if (error) {
      setLoginError(
        "Email ou mot de passe incorrect."
      );
      setLoggingIn(false);
      return;
    }

    setUser(data.user);
    setLoginEmail("");
    setLoginPassword("");
    setShowLogin(false);
    setLoggingIn(false);
  }

  async function handleLogout() {
    await signOut();
    setUser(null);
    setCombats([]);
  }

  /* =======================================================
     SELECTION
     ======================================================= */

  function toggle(id: string) {
    if (
      !enabledHeroIds.has(id)
    ) {
      return;
    }

    setShowResult(false);

    setPicks((prev) =>
      prev.includes(id)
        ? prev.filter(
            (p) => p !== id
          )
        : prev.length >=
          MAX_PICKS
        ? prev
        : [...prev, id]
    );
  }

  function reorderPicks(
    from: number,
    to: number
  ) {
    setPicks((prev) => {
      const next = [...prev];

      const [moved] =
        next.splice(
          from,
          1
        );

      next.splice(
        to,
        0,
        moved
      );

      return next;
    });
  }

  function reorderManual(
    arr: string[],
    setArr: (
      v: string[]
    ) => void,
    from: number,
    to: number
  ) {
    const next = [...arr];

    const [moved] =
      next.splice(
        from,
        1
      );

    next.splice(
      to,
      0,
      moved
    );

    setArr(next);
  }

  function reset() {
    setPicks([]);
    setQuery("");
    setActiveClass("All");
    setShowResult(false);
    setEditedTeam([]);
    setSwapIndex(null);
  }

  /* =======================================================
     COMBAT RECORDING
     ======================================================= */

  async function recordCombat(
    won: boolean
  ) {
    if (
      !user ||
      !full ||
      editedTeam.length !== 5 ||
      recording
    ) {
      return;
    }

    setRecording(true);

    try {
      const combat =
        await addCombat({
          enemy_heroes:
            picks,
          my_heroes:
            editedTeam,
          won,
        });

      if (combat) {
        setCombats(
          (prev) => [
            combat,
            ...prev,
          ]
        );
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement du combat :",
        error
      );
    } finally {
      setRecording(false);
    }
  }

  async function deleteCombat(
    id: string
  ) {
    const success =
      await removeCombat(id);

    if (success) {
      setCombats(
        (prev) =>
          prev.filter(
            (c) =>
              c.id !== id
          )
      );
    }
  }

  /* =======================================================
     MANUAL COMBAT
     ======================================================= */

  const [mEnemies, setMEnemies] =
    useState<string[]>([]);

  const [mMine, setMMine] =
    useState<string[]>([]);

  const [mWon, setMWon] =
    useState<boolean | null>(
      null
    );

  const [savingManual, setSavingManual] =
    useState(false);

  function toggleManual(
    arr: string[],
    setArr: (
      v: string[]
    ) => void,
    id: string
  ) {
    if (
      !enabledHeroIds.has(id)
    ) {
      return;
    }

    if (arr.includes(id)) {
      setArr(
        arr.filter(
          (p) => p !== id
        )
      );
    } else if (
      arr.length < MAX_PICKS
    ) {
      setArr([
        ...arr,
        id,
      ]);
    }
  }

  async function saveManual() {
    if (
      !user ||
      mEnemies.length !== 5 ||
      mMine.length !== 5 ||
      mWon === null
    ) {
      return;
    }

    setSavingManual(true);

    try {
      const combat =
        await addCombat({
          enemy_heroes:
            mEnemies,
          my_heroes:
            mMine,
          won: mWon,
        });

      if (combat) {
        setCombats(
          (prev) => [
            combat,
            ...prev,
          ]
        );

        setMEnemies([]);
        setMMine([]);
        setMWon(null);
        setShowManual(false);
      }
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement manuel du combat :",
        error
      );
    } finally {
      setSavingManual(false);
    }
  }

  const winCount =
    combats.filter(
      (c) => c.won
    ).length;

  const mReady =
    mEnemies.length === 5 &&
    mMine.length === 5 &&
    mWon !== null;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white relative overflow-hidden">

      {/* =================================================
          HERO MANAGER
          ================================================= */}

      {showHeroManager && (
        <HeroManager
          enabledIds={
            enabledHeroIds
          }
		  usage={usage}
          onToggleHero={
            toggleHeroEnabled
          }
          onEnableAll={
            enableAllHeroes
          }
          onDisableAll={
            disableAllHeroes
          }
          onClose={() =>
            setShowHeroManager(false)
          }
        />
      )}

      {/* =================================================
          LOGIN
          ================================================= */}

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#11111d] shadow-2xl p-6">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  🔐 Administration
                </h2>

                <p className="text-xs text-white/40 mt-1">
                  Connexion réservée à
                  l'administrateur
                </p>
              </div>

              <button
                onClick={() => {
                  setShowLogin(false);
                  setLoginError("");
                }}
                className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  Adresse e-mail
                </label>

                <input
                  type="email"
                  value={
                    loginEmail
                  }
                  onChange={(e) =>
                    setLoginEmail(
                      e.target.value
                    )
                  }
                  placeholder="Votre adresse e-mail"
                  autoComplete="email"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  Mot de passe
                </label>

                <input
                  type="password"
                  value={
                    loginPassword
                  }
                  onChange={(e) =>
                    setLoginPassword(
                      e.target.value
                    )
                  }
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {loginError && (
                <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loggingIn
                }
                className="w-full py-2.5 rounded-lg bg-amber-400 text-black font-semibold text-sm hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loggingIn
                  ? "Connexion..."
                  : "Se connecter"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          BACKGROUND
          ================================================= */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

{/* =================================================
    HEADER
    ================================================= */}

<header className="mb-10">
  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

    <div className="text-center lg:text-left">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/60 mb-4">
  <Swords className="h-3.5 w-3.5 text-amber-400" />
  <span>Lords Mobile Counter By Kikoine</span>
  <span className="text-white/30">•</span>
  <span className="text-amber-300/70">v{APP_VERSION}</span>
</div>

      <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 bg-clip-text text-transparent">
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
              👑 Admin
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
            🔐 Admin
          </button>
        )}
      </div>

      {/* HERO MANAGEMENT — ADMIN ONLY */}
      {user && (
        <button
          onClick={() => setShowHeroManager(true)}
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
              onClick={() => setShowHistory((v) => !v)}
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
              onClick={() => setShowManual(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Enregistrer un combat passé
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40">
            🔒 Historique et enregistrement réservés à l'Admin
          </span>
        )}
      </div>

    </div>
  </div>
</header>

{/* =================================================
    HISTORY
    ================================================= */}

        {user &&
          showHistory && (
            <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/80">
                  Historique des combats
                </h3>

                <button
                  onClick={() =>
                    setShowHistory(false)
                  }
                  className="text-white/40 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {loadingHistory ? (
                <p className="text-center text-white/40 text-sm py-4">
                  Chargement...
                </p>
              ) : combats.length ===
                0 ? (
                <p className="text-center text-white/40 text-sm py-4">
                  Aucun combat enregistré.
                  Clique sur « Enregistrer
                  un combat passé » pour
                  commencer.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {combats.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-lg bg-black/30 border border-white/5 p-2"
                    >
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          c.won
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {c.won
                          ? "VICTOIRE"
                          : "DÉFAITE"}
                      </span>

                      <span className="text-[10px] text-white/40 whitespace-nowrap">
                        {new Date(
                          c.created_at
                        ).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                          }
                        )}
                        {" · "}
                        {new Date(
                          c.created_at
                        ).toLocaleTimeString(
                          "fr-FR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-white/40">
                            Ennemis:
                          </span>

                          {c.enemy_heroes.map(
                            (id) => {
                              const h =
                                HEROES.find(
                                  (x) =>
                                    x.id ===
                                    id
                                );

                              return h ? (
                                <img
                                  key={id}
                                  src={h.img}
                                  alt={h.name}
                                  className="h-5 w-5 rounded object-cover"
                                  title={
                                    h.name
                                  }
                                />
                              ) : null;
                            }
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-wrap mt-1">
                          <span className="text-[10px] text-white/40">
                            Mon équipe:
                          </span>

                          {c.my_heroes.map(
                            (id) => {
                              const h =
                                HEROES.find(
                                  (x) =>
                                    x.id ===
                                    id
                                );

                              return h ? (
                                <img
                                  key={id}
                                  src={h.img}
                                  alt={h.name}
                                  className="h-5 w-5 rounded object-cover"
                                  title={
                                    h.name
                                  }
                                />
                              ) : null;
                            }
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          deleteCombat(
                            c.id
                          )
                        }
                        className="text-white/30 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* =================================================
            MANUAL COMBAT MODAL
            ================================================= */}

        {showManual && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() =>
              setShowManual(false)
            }
          >
            <div
              className="bg-[#12121e] border border-white/10 rounded-2xl p-5 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
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
        )}

        {/* =================================================
            PICKS
            ================================================= */}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-rose-400" />

              <span className="text-sm font-medium text-white/80">
                Ennemis choisis{" "}
                <span className="text-white/40">
                  ({picks.length}/
                  {MAX_PICKS})
                </span>
              </span>
            </div>

            {picks.length > 0 && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {Array.from({
              length: MAX_PICKS,
            }).map((_, i) => {
              const id =
                picks[i];

              const hero = id
                ? HEROES.find(
                    (h) =>
                      h.id === id
                  )
                : null;

              return (
                <div
                  key={i}
                  draggable={!!hero}
                  onDragStart={() =>
                    setDragIndex(i)
                  }
                  onDragEnd={() => {
                    setDragIndex(
                      null
                    );
                    setDragOverIndex(
                      null
                    );
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIndex(
                      i
                    );
                  }}
                  onDrop={() => {
                    if (
                      dragIndex !==
                        null &&
                      dragIndex !==
                        i &&
                      picks[
                        dragIndex
                      ]
                    ) {
                      reorderPicks(
                        dragIndex,
                        i
                      );
                    }

                    setDragIndex(
                      null
                    );

                    setDragOverIndex(
                      null
                    );
                  }}
                  className={`aspect-square rounded-2xl border flex items-center justify-center overflow-hidden relative transition-all ${
                    hero
                      ? "border-amber-400/50 cursor-grab active:cursor-grabbing"
                      : "border-dashed border-white/15 bg-white/[0.02]"
                  } ${
                    dragOverIndex ===
                      i &&
                    dragIndex !==
                      null &&
                    dragIndex !== i
                      ? "ring-2 ring-cyan-400/60 scale-105"
                      : ""
                  } ${
                    dragIndex === i
                      ? "opacity-40"
                      : ""
                  }`}
                >
                  {hero ? (
                    <>
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[hero.type]} opacity-40`}
                      />

                      <img
                        src={hero.img}
                        alt={hero.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                      <button
                        onClick={() =>
                          toggle(
                            hero.id
                          )
                        }
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 hover:bg-rose-500 flex items-center justify-center transition-colors z-10"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>

                      <div className="absolute bottom-1 left-1 right-1 text-center">
                        <span className="text-[9px] sm:text-[11px] font-semibold drop-shadow-lg line-clamp-1 block">
                          {hero.name}
                        </span>

                        <span
                          className={`text-[8px] sm:text-[10px] font-bold drop-shadow-lg ${TYPE_TEXT[hero.type]}`}
                        >
                          {hero.type}
                        </span>

                        <span
                          className={`text-[8px] sm:text-[10px] font-bold drop-shadow-lg ${CLASS_TEXT[hero.cls]}`}
                        >
                          {" · "}
                          {hero.cls}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-white/20 text-2xl font-light">
                      {i + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================
            FIND TEAM
            ================================================= */}

        {full &&
          !showResult && (
            <div className="flex justify-center mb-8">
              <button
                onClick={() => {
                  setEditedTeam(
                    team
                      .map(
                        (h) =>
                          h.id
                      )
                      .filter(
                        (id) =>
                          enabledHeroIds.has(
                            id
                          )
                      )
                  );

                  setShowResult(
                    true
                  );
                }}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 text-black font-bold shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform"
              >
                Trouver la meilleure contre
              </button>
            </div>
          )}

        {/* =================================================
            RESULT
            ================================================= */}

        {showResult &&
          full && (
            <div className="mb-10 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 backdrop-blur-sm">

              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                  <Swords className="h-5 w-5 text-amber-400" />

                  Équipe recommandée

                  {winRate !== null ? (
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg ${
                        winRate.rate >=
                        50
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      <Trophy className="h-3.5 w-3.5" />

                      {winRate.rate}%
                      de victoire

                      <span className="text-[10px] font-normal opacity-60">
                        (
                        {
                          winRate.count
                        }{" "}
                        combat
                        {winRate.count >
                        1
                          ? "s"
                          : ""}
                        )
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-white/30">
                      Pas encore de
                      données
                    </span>
                  )}
                </h2>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/50">
                    {totalCoverage} contre(s)
                    couvert(s) sur{" "}
                    {MAX_PICKS} ennemis
                  </span>

                  <button
                    onClick={() =>
                      setEditedTeam(
                        team.map(
                          (h) =>
                            h.id
                        )
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-amber-300 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restaurer
                  </button>
                </div>
              </div>

              {/* TEAM CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {report.map(
                  ({
                    hero,
                  }, idx) => (
                    <div
                      key={hero.id}
                      className="rounded-2xl overflow-hidden border border-white/10 bg-black/30"
                    >
                      <div
                        className={`relative h-28 bg-gradient-to-br ${TYPE_GRADIENT[hero.type]}`}
                      >
                        <img
                          src={hero.img}
                          alt={
                            hero.name
                          }
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover opacity-90"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                        <span
                          className={`absolute top-2 left-2 text-[10px] uppercase tracking-wider font-medium ${TYPE_TEXT[hero.type]} drop-shadow-lg`}
                        >
                          {hero.type}
                        </span>

                        <span
                          className={`absolute top-2 right-2 text-[10px] uppercase tracking-wider font-bold ${CLASS_TEXT[hero.cls]} drop-shadow-lg`}
                        >
                          {hero.cls}
                        </span>

                        <span className="absolute bottom-2 left-2 right-2 text-sm font-bold drop-shadow-lg">
                          {hero.name}
                        </span>
                      </div>

                      <div className="p-3">
                        <div className="text-[11px] text-white/40 italic">
                          "{hero.alias}"
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-white/60">
                          <span className="text-rose-300/80">
                            PV{" "}
                            <b className="text-white/80">
                              {formatStat(
                                hero
                                  .stats
                                  .hp
                              )}
                            </b>
                          </span>

                          <span className="text-amber-300/80">
                            ATK{" "}
                            <b className="text-white/80">
                              {formatStat(
                                hero
                                  .stats
                                  .atk
                              )}
                            </b>
                          </span>

                          <span className="text-sky-300/80">
                            MATK{" "}
                            <b className="text-white/80">
                              {formatStat(
                                hero
                                  .stats
                                  .matk
                              )}
                            </b>
                          </span>

                          <span className="text-emerald-300/80">
                            DEF{" "}
                            <b className="text-white/80">
                              {formatStat(
                                hero
                                  .stats
                                  .def
                              )}
                            </b>
                          </span>

                          <span className="text-cyan-300/80">
                            MDEF{" "}
                            <b className="text-white/80">
                              {formatStat(
                                hero
                                  .stats
                                  .mdef
                              )}
                            </b>
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {report.find(
                            (r) =>
                              r.hero
                                .id ===
                              hero.id
                          )?.targets.map(
                            (t) => {
                              const e =
                                HEROES.find(
                                  (h) =>
                                    h.id ===
                                    t.id
                                )!;

                              return (
                                <span
                                  key={
                                    t.id
                                  }
                                  title={`Contre ${e.name}`}
                                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20"
                                >
                                  <img
                                    src={
                                      e.img
                                    }
                                    alt=""
                                    className="h-3 w-3 rounded object-cover"
                                  />
                                  {
                                    e.name
                                  }
                                </span>
                              );
                            }
                          )}

                          {(
                            report.find(
                              (r) =>
                                r.hero
                                  .id ===
                                hero.id
                            )?.targets
                              .length ??
                            0
                          ) ===
                            0 && (
                            <span className="text-[10px] text-white/30">
                              Polyvalent
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            setSwapIndex(
                              idx
                            )
                          }
                          className="mt-3 w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                          Remplacer
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* =================================================
                  SWAP MODAL
                  ================================================= */}

              {swapIndex !==
                null && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                  onClick={() =>
                    setSwapIndex(
                      null
                    )
                  }
                >
                  <div
                    className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 p-5 max-h-[80vh] overflow-y-auto"
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white/80">
                        Remplacer{" "}
                        {
                          editedHeroes[
                            swapIndex
                          ]?.name
                        }
                      </h3>

                      <button
                        onClick={() =>
                          setSwapIndex(
                            null
                          )
                        }
                        className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>

                    <input
                      autoFocus
                      value={
                        swapQuery
                      }
                      onChange={(e) =>
                        setSwapQuery(
                          e.target
                            .value
                        )
                      }
                      placeholder="Rechercher..."
                      className="w-full mb-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50"
                    />

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {HEROES
                        .filter(
                          (h) =>
                            enabledHeroIds.has(
                              h.id
                            )
                        )
                        .filter(
                          (h) =>
                            h.id !==
                              editedTeam[
                                swapIndex
                              ] &&
                            !editedTeam.includes(
                              h.id
                            )
                        )
                        .filter(
                          (h) =>
                            !swapQuery ||
                            h.name
                              .toLowerCase()
                              .includes(
                                swapQuery.toLowerCase()
                              ) ||
                            h.alias
                              .toLowerCase()
                              .includes(
                                swapQuery.toLowerCase()
                              )
                        )
                        .sort(
                          (a, b) =>
                            (usage[
                              b.id
                            ] ??
                              0) -
                              (usage[
                                a.id
                              ] ??
                                0) ||
                            a.name.localeCompare(
                              b.name
                            )
                        )
                        .map(
                          (h) => (
                            <button
                              key={
                                h.id
                              }
                              onClick={() => {
                                setEditedTeam(
                                  (
                                    prev
                                  ) =>
                                    prev.map(
                                      (
                                        id,
                                        i
                                      ) =>
                                        i ===
                                        swapIndex
                                          ? h.id
                                          : id
                                    )
                                );

                                setSwapIndex(
                                  null
                                );

                                setSwapQuery(
                                  ""
                                );
                              }}
                              className="group relative w-full overflow-hidden rounded-xl border border-white/10 hover:border-amber-400/50 hover:scale-[1.03] transition-all"
                            >
                              <div
                                className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[h.type]} opacity-80`}
                              />

                              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />

                              <div className="relative p-2 flex flex-col items-center gap-1">
                                <img
                                  src={
                                    h.img
                                  }
                                  alt={
                                    h.name
                                  }
                                  loading="lazy"
                                  className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/20"
                                />

                                <span className="text-white font-semibold text-[11px] text-center leading-tight drop-shadow line-clamp-1">
                                  {
                                    h.name
                                  }
                                </span>

                                <span
                                  className={`text-[8px] uppercase tracking-wider font-bold ${CLASS_TEXT[h.cls]} drop-shadow`}
                                >
                                  {
                                    h.cls
                                  }
                                </span>
                              </div>
                            </button>
                          )
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  TEAM ANALYSIS
                  ================================================= */}

              {(() => {
                const enemyHeroes =
                  picks
                    .map(
                      (id) =>
                        HEROES.find(
                          (h) =>
                            h.id ===
                            id
                        )!
                    )
                    .filter(Boolean);

                const myHeroesFinal =
                  editedHeroes.length ===
                  5
                    ? (editedHeroes as any)
                    : team.map(
                        (h) => h
                      );

                if (
                  enemyHeroes.length !==
                    5 ||
                  myHeroesFinal.length !==
                    5
                ) {
                  return null;
                }

                const sumStats = (
                  heroes: typeof enemyHeroes
                ) => {
                  const s = {
                    hp: 0,
                    atk: 0,
                    matk: 0,
                    def: 0,
                    mdef: 0,
                  };

                  for (const h of heroes) {
                    s.hp +=
                      h.stats.hp;
                    s.atk +=
                      h.stats.atk;
                    s.matk +=
                      h.stats.matk;
                    s.def +=
                      h.stats.def;
                    s.mdef +=
                      h.stats.mdef;
                  }

                  return s;
                };

                const enemySum =
                  sumStats(
                    enemyHeroes
                  );

                const mySum =
                  sumStats(
                    myHeroesFinal
                  );

                const classCount =
                  (
                    heroes: typeof enemyHeroes
                  ) => {
                    const counts: Record<
                      string,
                      number
                    > = {
                      STR: 0,
                      AGI: 0,
                      INT: 0,
                    };

                    for (const h of heroes) {
                      counts[
                        h.cls
                      ]++;
                    }

                    return counts;
                  };

                const enemyClasses =
                  classCount(
                    enemyHeroes
                  );

                const myClasses =
                  classCount(
                    myHeroesFinal
                  );

                const typeCount =
                  (
                    heroes: typeof enemyHeroes
                  ) => {
                    const counts: Record<
                      string,
                      number
                    > = {};

                    for (const h of heroes) {
                      counts[
                        h.type
                      ] =
                        (counts[
                          h.type
                        ] ?? 0) + 1;
                    }

                    return counts;
                  };

                const enemyTypes =
                  typeCount(
                    enemyHeroes
                  );

                const myTypes =
                  typeCount(
                    myHeroesFinal
                  );

                const OFFENSE_META:
                  {
                    key: keyof typeof enemySum;
                    label: string;
                    color: string;
                  }[] = [
                  {
                    key: "atk",
                    label: "ATK",
                    color: "#fbbf24",
                  },
                  {
                    key: "matk",
                    label: "MATK",
                    color: "#38bdf8",
                  },
                ];

                const DEFENSE_META:
                  {
                    key: keyof typeof enemySum;
                    label: string;
                    color: string;
                  }[] = [
                  {
                    key: "def",
                    label: "DEF",
                    color: "#10b981",
                  },
                  {
                    key: "mdef",
                    label: "MDEF",
                    color: "#6366f1",
                  },
                ];

                const PieChart = ({
                  data,
                  side,
                  meta,
                  title,
                }: {
                  data: typeof enemySum;
                  side:
                    | "enemy"
                    | "mine";
                  meta: typeof OFFENSE_META;
                  title: string;
                }) => {
                  const total =
                    meta.reduce(
                      (a, s) =>
                        a +
                        data[
                          s.key
                        ],
                      0
                    ) || 1;

                  let angle = -90;

                  const slices =
                    meta.map(
                      (s) => {
                        const value =
                          data[
                            s.key
                          ];

                        const pct =
                          value /
                          total;

                        const sweep =
                          pct *
                          360;

                        const start =
                          angle;

                        const end =
                          angle +
                          sweep;

                        angle = end;

                        const large =
                          sweep >
                          180
                            ? 1
                            : 0;

                        const r = 44;
                        const cx = 50;
                        const cy = 50;

                        const rad = (
                          d: number
                        ) =>
                          (d *
                            Math.PI) /
                          180;

                        const x1 =
                          cx +
                          r *
                            Math.cos(
                              rad(
                                start
                              )
                            );

                        const y1 =
                          cy +
                          r *
                            Math.sin(
                              rad(
                                start
                              )
                            );

                        const x2 =
                          cx +
                          r *
                            Math.cos(
                              rad(
                                end
                              )
                            );

                        const y2 =
                          cy +
                          r *
                            Math.sin(
                              rad(
                                end
                              )
                            );

                        return {
                          ...s,
                          value,
                          pct,
                          path: `M ${cx} ${cy} L ${x1.toFixed(
                            2
                          )} ${y1.toFixed(
                            2
                          )} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(
                            2
                          )} ${y2.toFixed(
                            2
                          )} Z`,
                        };
                      }
                    );

                  const ringColor =
                    side ===
                    "enemy"
                      ? "#fb7185"
                      : "#34d399";

                  return (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                        {title}
                      </span>

                      <svg
                        width="100"
                        height="100"
                        viewBox="0 0 100 100"
                        className="drop-shadow-lg"
                      >
                        {slices.map(
                          (
                            sl,
                            i
                          ) => (
                            <path
                              key={
                                i
                              }
                              d={
                                sl.path
                              }
                              fill={
                                sl.color
                              }
                              stroke="#0a0a0f"
                              strokeWidth="1.5"
                              className="transition-all duration-300 hover:opacity-80"
                            />
                          )
                        )}

                        <circle
                          cx="50"
                          cy="50"
                          r="24"
                          fill="#0a0a0f"
                          stroke={
                            ringColor
                          }
                          strokeWidth="1.5"
                          opacity="0.95"
                        />

                        <text
                          x="50"
                          y="54"
                          textAnchor="middle"
                          className="fill-white/60 text-[7px]"
                        >
                          {formatStat(
                            total
                          )}
                        </text>
                      </svg>

                      <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 max-w-[120px]">
                        {slices
                          .filter(
                            (s) =>
                              s.value >
                              0
                          )
                          .map(
                            (s) => (
                              <span
                                key={
                                  s.label
                                }
                                className="inline-flex items-center gap-1 text-[8px] text-white/70"
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      s.color,
                                  }}
                                />

                                {
                                  s.label
                                }

                                <span className="text-white/40">
                                  {Math.round(
                                    s.pct *
                                      100
                                  )}
                                  %
                                </span>
                              </span>
                            )
                          )}
                      </div>
                    </div>
                  );
                };

                const HpBar = ({
                  data,
                  side,
                  max,
                }: {
                  data: typeof enemySum;
                  side:
                    | "enemy"
                    | "mine";
                  max: number;
                }) => {
                  const color =
                    side ===
                    "enemy"
                      ? "from-rose-500 to-rose-400"
                      : "from-emerald-500 to-emerald-400";

                  const pct =
                    max > 0
                      ? (data.hp /
                          max) *
                        100
                      : 0;

                  return (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-rose-300/80">
                          PV
                        </span>

                        <span
                          className={`text-[10px] font-bold tabular-nums ${
                            side ===
                            "enemy"
                              ? "text-rose-300"
                              : "text-emerald-300"
                          }`}
                        >
                          {formatStat(
                            data.hp
                          )}
                        </span>
                      </div>

                      <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`}
                          style={{
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                };

                const ClassBadge = ({
                  cls,
                  count,
                }: {
                  cls: string;
                  count: number;
                  side:
                    | "enemy"
                    | "mine";
                }) => {
                  if (
                    count === 0
                  ) {
                    return null;
                  }

                  const color =
                    cls ===
                    "STR"
                      ? "text-rose-300 bg-rose-500/15 border-rose-500/25"
                      : cls ===
                        "AGI"
                      ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/25"
                      : "text-sky-300 bg-sky-500/15 border-sky-500/25";

                  return (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${color}`}
                    >
                      {cls}{" "}
                      <span className="text-white/60 font-normal">
                        ×{count}
                      </span>
                    </span>
                  );
                };

                return (
				
				

<div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
  <div className="flex items-center gap-2 mb-4">
    <Scale className="h-4 w-4 text-amber-400" />
    <span className="text-sm font-medium text-white/80">
      Analyse des équipes
    </span>
  </div>

  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-5">
    <span className="text-xs font-semibold text-white/70 text-right">
      Équipe ennemie
    </span>

    <span className="text-white/20 text-xs">
      VS
    </span>

    <span className="text-xs font-semibold text-white/70 text-left">
      Mon équipe
    </span>
  </div>

{/* =================================================
    COMPARAISON DES STATISTIQUES
    ================================================= */}

<div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">

  <div className="flex items-center gap-2 mb-4">
    <Scale className="h-4 w-4 text-amber-400" />

    <span className="text-sm font-medium text-white/80">
      Comparaison des statistiques
    </span>
  </div>

  <div className="space-y-3">

    {[
      {
        key: "atk",
        label: "ATTAQUE",
        enemy: enemySum.atk,
        mine: mySum.atk,
      },
      {
        key: "matk",
        label: "ATQ MAG",
        enemy: enemySum.matk,
        mine: mySum.matk,
      },
      {
        key: "def",
        label: "DÉFENSE",
        enemy: enemySum.def,
        mine: mySum.def,
      },
      {
        key: "mdef",
        label: "MDEF",
        enemy: enemySum.mdef,
        mine: mySum.mdef,
      },
      {
        key: "hp",
        label: "PV",
        enemy: enemySum.hp,
        mine: mySum.hp,
      },
    ].map((stat) => {

      const max = Math.max(
        stat.enemy,
        stat.mine,
        1
      );

      const enemyWidth =
        (stat.enemy / max) * 100;

      const mineWidth =
        (stat.mine / max) * 100;

      const enemyBetter =
        stat.enemy > stat.mine;

      const mineBetter =
        stat.mine > stat.enemy;

      return (
        <div
          key={stat.key}
          className="grid grid-cols-[1fr_55px_auto_55px_1fr] items-center gap-2"
        >

          {/* ================================
              BARRE ENNEMI
              ANCRÉE AU CENTRE
              ================================ */}

          <div className="flex justify-end">

            <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">

              <div
                className={`h-full rounded-full ${
                  enemyBetter
                    ? "bg-emerald-400"
                    : mineBetter
                    ? "bg-rose-400"
                    : "bg-white/30"
                }`}
                style={{
                  width: `${enemyWidth}%`,
                  marginLeft: "auto",
                }}
              />

            </div>

          </div>


          {/* ================================
              VALEUR ENNEMIE
              ================================ */}

          <span
            className={`text-right text-xs font-bold tabular-nums ${
              enemyBetter
                ? "text-emerald-300"
                : mineBetter
                ? "text-rose-300"
                : "text-white/70"
            }`}
          >
            {stat.enemy.toLocaleString("fr-FR")}
          </span>


          {/* ================================
              NOM STAT
              ================================ */}

          <span className="text-[9px] font-bold text-white/40 text-center whitespace-nowrap">
            {stat.label}
          </span>


          {/* ================================
              VALEUR MOI
              ================================ */}

          <span
            className={`text-left text-xs font-bold tabular-nums ${
              mineBetter
                ? "text-emerald-300"
                : enemyBetter
                ? "text-rose-300"
                : "text-white/70"
            }`}
          >
            {stat.mine.toLocaleString("fr-FR")}
          </span>


          {/* ================================
              BARRE MOI
              ANCRÉE AU CENTRE
              ================================ */}

          <div>

            <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">

              <div
                className={`h-full rounded-full ${
                  mineBetter
                    ? "bg-emerald-400"
                    : enemyBetter
                    ? "bg-rose-400"
                    : "bg-white/30"
                }`}
                style={{
                  width: `${mineWidth}%`,
                }}
              />

            </div>

          </div>

        </div>
      );
    })}

  </div>

</div>

</div>

              );
              })()}

{/* =================================================
    BEST WIN TEAM
    ================================================= */}

{/* =================================================
    BEST WIN TEAM
    ================================================= */}
{/* =================================================
    BEST WIN TEAM
    ================================================= */}

              {bestWinTeam && (
                <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-amber-300">
                    <Crown className="h-4 w-4" />

                    Équipe de contre ayant le plus gagné

                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {bestWinTeam.rate}%
                      de victoire

                      <span className="text-[10px] font-normal opacity-60">
                        (
                        {
                          bestWinTeam.count
                        }{" "}
                        combat
                        {bestWinTeam.count >
                        1
                          ? "s"
                          : ""}
                        )
                      </span>
                    </span>
                  </h3>

                  <div className="grid grid-cols-5 gap-2">
                    {bestWinTeam.ids.map(
                      (id) => {
                        const h =
                          HEROES.find(
                            (x) =>
                              x.id ===
                              id
                          );

                        if (!h)
                          return null;

                        return (
                          <button
                            key={
                              id
                            }
                            onClick={() =>
                              setEditedTeam(
                                bestWinTeam.ids
                              )
                            }
                            className="group relative rounded-xl overflow-hidden border border-amber-500/30 hover:border-amber-400/60 hover:scale-[1.03] transition-all"
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[h.type]} opacity-70`}
                            />

                            <div className="absolute inset-0 bg-black/40" />

                            <div className="relative p-2 flex flex-col items-center gap-1">
                              <img
                                src={
                                  h.img
                                }
                                alt={
                                  h.name
                                }
                                loading="lazy"
                                className="h-12 w-12 rounded-lg object-cover ring-1 ring-white/20"
                              />

                              <span className="text-white font-semibold text-[11px] text-center leading-tight drop-shadow line-clamp-1">
                                {
                                  h.name
                                }
                              </span>

                              <span
                                className={`text-[8px] uppercase tracking-wider font-bold ${CLASS_TEXT[h.cls]} drop-shadow`}
                              >
                                {
                                  h.cls
                                }
                              </span>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>

                  <p className="mt-3 text-[11px] text-white/40">
                    Clique sur l'équipe pour
                    l'utiliser. Basé sur tes combats
                    passés contre une composition
                    ennemie similaire.
                  </p>
                </div>
              )}


          {/* =================================================
              RECORD RESULT
              ================================================= */}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-4 w-4 text-amber-400" />

              <span className="text-sm font-medium text-white/80">
                Enregistrer le résultat de ce combat
              </span>
            </div>

            <p className="text-xs text-white/50 mb-3">
              Tes résultats influencent les futures
              recommandations pour cette composition ennemie.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => recordCombat(true)}
                disabled={recording}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                <Trophy className="inline h-4 w-4 mr-1" />
                Victoire
              </button>

              <button
                onClick={() => recordCombat(false)}
                disabled={recording}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold hover:bg-rose-500/30 transition-colors disabled:opacity-50"
              >
                Défaite
              </button>
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Recommencer
            </button>
          </div>

        </div>
      )}

      {/* =================================================
          FILTERS
          ================================================= */}
<div className="flex flex-col gap-3 mb-5">

  {/* Recherche */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />

    <input
      value={query}
      onChange={(e) =>
        setQuery(e.target.value)
      }
      placeholder="Rechercher par nom ou alias..."
      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
    />
  </div>

  {/* Classement */}
  <div className="flex flex-wrap gap-2">
    {(
      [
        ["played", "Plus joués"],
        ["hp", "PV"],
        ["atk", "ATQ"],
        ["matk", "ATQ MAG"],
        ["def", "DEF"],
        ["mdef", "MDEF"],
      ] as const
    ).map(([value, label]) => (
      <button
        key={value}
        onClick={() => setSortBy(value)}
        className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
          sortBy === value
            ? "bg-amber-400 text-black"
            : "bg-white/5 text-white/60 hover:bg-white/10"
        }`}
      >
        {label}
      </button>
    ))}
  </div>

  {/* Classes */}
  <div className="flex flex-wrap gap-2">
    {(
      ["All", ...CLASSES] as const
    ).map((c) => (
      <button
        key={c}
        onClick={() =>
          setActiveClass(c)
        }
        className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
          activeClass === c
            ? "bg-white text-black"
            : "bg-white/5 text-white/60 hover:bg-white/10"
        }`}
      >
        {c === "All"
          ? "Toutes classes"
          : c}
      </button>
    ))}
  </div>

</div>

        {/* =================================================
            ROSTER
            ================================================= */}

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
         {filtered.map((hero) => (
              <button
                key={
                  hero.id
                }
                onClick={() =>
                  toggle(
                    hero.id
                  )
                }
                disabled={
                  full &&
                  !pickSet.has(
                    hero.id
                  )
                }
                className={`group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
                  pickSet.has(
                    hero.id
                  )
                    ? "border-amber-400 ring-2 ring-amber-400/60 scale-[1.02]"
                    : full
                    ? "border-white/5 opacity-30 cursor-not-allowed"
                    : "border-white/10 hover:border-white/30 hover:scale-[1.03] cursor-pointer"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${TYPE_GRADIENT[hero.type]} opacity-80`}
                />

                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />

                <div className="relative p-2 flex flex-col items-center gap-1">
                  <img
                    src={
                      hero.img
                    }
                    alt={
                      hero.name
                    }
                    loading="lazy"
                    className="h-14 w-14 rounded-lg object-cover ring-1 ring-white/20"
                  />

                  <span className="text-white font-semibold text-xs text-center leading-tight drop-shadow line-clamp-1">
                    {
                      hero.name
                    }
                  </span>

                  <span
                    className={`text-[9px] uppercase tracking-wider font-medium ${TYPE_TEXT[hero.type]} drop-shadow`}
                  >
                    {
                      hero.type
                    }
                  </span>

                  <span
                    className={`text-[9px] uppercase tracking-wider font-bold ${CLASS_TEXT[hero.cls]} drop-shadow`}
                  >
                    {
                      hero.cls
                    }
                  </span>

                  <div className="mt-1 w-full grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] text-white/70">
                    <div className="flex justify-between">
                      <span className="text-rose-300/80">
                        PV
                      </span>

                      <span className="font-semibold">
                        {formatStat(
                          hero
                            .stats
                            .hp
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-amber-300/80">
                        ATK
                      </span>

                      <span className="font-semibold">
                        {formatStat(
                          hero
                            .stats
                            .atk
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sky-300/80">
                        MATK
                      </span>

                      <span className="font-semibold">
                        {formatStat(
                          hero
                            .stats
                            .matk
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-emerald-300/80">
                        DEF
                      </span>

                      <span className="font-semibold">
                        {formatStat(
                          hero
                            .stats
                            .def
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-cyan-300/80">
                        MDEF
                      </span>

                      <span className="font-semibold">
                        {formatStat(
                          hero
                            .stats
                            .mdef
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {pickSet.has(
                  hero.id
                ) && (
                  <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center">
                    <X
                      className="h-3 w-3 text-black"
                      strokeWidth={3}
                    />
                  </div>
                )}
              </button>
            )
          )}
        </div>

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