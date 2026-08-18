import { useState } from "react";

import {
  addCombat,
} from "../storage";

const MAX_PICKS = 5;

interface UseManualCombatOptions {
  user: any;
  enabledHeroIds: Set<string>;
  onCombatSaved?: (combat: any) => void;
}

export function useManualCombat({
  user,
  enabledHeroIds,
  onCombatSaved,
}: UseManualCombatOptions) {
  const [mEnemies, setMEnemies] =
    useState<string[]>([]);

  const [mMine, setMMine] =
    useState<string[]>([]);

  const [mWon, setMWon] =
    useState<boolean | null>(null);

  const [savingManual, setSavingManual] =
    useState(false);

  function toggleManual(
    arr: string[],
    setArr: (
      value: string[]
    ) => void,
    id: string
  ) {
    if (!enabledHeroIds.has(id)) {
      return;
    }

    if (arr.includes(id)) {
      setArr(
        arr.filter(
          (heroId) => heroId !== id
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
      mEnemies.length !== MAX_PICKS ||
      mMine.length !== MAX_PICKS ||
      mWon === null
    ) {
      return;
    }

    setSavingManual(true);

    try {
      const combat = await addCombat({
        enemy_heroes: mEnemies,
        my_heroes: mMine,
        won: mWon,
      });

      if (combat) {
        onCombatSaved?.(combat);

        setMEnemies([]);
        setMMine([]);
        setMWon(null);
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

  const mReady =
    mEnemies.length === MAX_PICKS &&
    mMine.length === MAX_PICKS &&
    mWon !== null;

  return {
    mEnemies,
    setMEnemies,

    mMine,
    setMMine,

    mWon,
    setMWon,

    savingManual,

    toggleManual,
    saveManual,

    mReady,
  };
}