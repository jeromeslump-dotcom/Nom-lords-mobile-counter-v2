import type { Hero } from "../heroes";

export type TeamStats = {
  hp: number;
  atk: number;
  def: number;
  matk: number;
  mdef: number;
  totalAtk: number;
  totalDef: number;
};

export function calculateTeamStats(team: Hero[]): TeamStats {
  return team.reduce(
    (total, hero) => ({
      hp: total.hp + (hero.stats?.hp ?? 0),

      atk: total.atk + (hero.stats?.atk ?? 0),

      def: total.def + (hero.stats?.def ?? 0),

      matk: total.matk + (hero.stats?.matk ?? 0),

      mdef: total.mdef + (hero.stats?.mdef ?? 0),

      totalAtk:
        total.totalAtk +
        (hero.stats?.atk ?? 0) +
        (hero.stats?.matk ?? 0),

      totalDef:
        total.totalDef +
        (hero.stats?.def ?? 0) +
        (hero.stats?.mdef ?? 0),
    }),
    {
      hp: 0,
      atk: 0,
      def: 0,
      matk: 0,
      mdef: 0,
      totalAtk: 0,
      totalDef: 0,
    },
  );
}

export type TeamStatComparison = {
  enemy: number;
  mine: number;
  difference: number;
  percentage: number;
};

export function compareStat(
  enemy: number,
  mine: number,
): TeamStatComparison {
  const difference = mine - enemy;

  const percentage =
    enemy === 0
      ? mine > 0
        ? 100
        : 0
      : (difference / enemy) * 100;

  return {
    enemy,
    mine,
    difference,
    percentage,
  };
}