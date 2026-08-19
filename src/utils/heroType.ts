import type { Hero } from "../heroes";

export const TYPE_GRADIENT: Record<string, string> = {
  Infantry: "from-red-900 via-red-700 to-orange-900",
  Cavalry: "from-blue-900 via-blue-700 to-cyan-900",
  Ranged: "from-emerald-900 via-green-700 to-teal-900",
  "Siege Engine": "from-purple-900 via-violet-700 to-indigo-900",
};

export function getHeroTypeGradient(hero: Hero): string {
  return TYPE_GRADIENT[hero.type] ?? "from-slate-900 via-slate-700 to-slate-900";
}
