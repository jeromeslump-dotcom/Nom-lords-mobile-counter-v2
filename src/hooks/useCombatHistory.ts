import { useEffect, useState } from "react";

import {
  loadCombats,
  addCombat,
  removeCombat,
} from "../storage";

import type { Combat } from "../storage";

interface UseCombatHistoryOptions {
  user: any;
  picks: string[];
  editedTeam: string[];
}

export function useCombatHistory({
  user,
  picks,
  editedTeam,
}: UseCombatHistoryOptions) {
  const [combats, setCombats] =
    useState<Combat[]>([]);

  const [loadingHistory, setLoadingHistory] =
    useState(true);

  const [recording, setRecording] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoadingHistory(true);

      try {
        const data = await loadCombats();

        if (!cancelled) {
          setCombats(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement de l'historique :",
          error
        );

        if (!cancelled) {
          setCombats([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function recordCombat(
    won: boolean
  ) {
    if (
      !user ||
      picks.length !== 5 ||
      editedTeam.length !== 5 ||
      recording
    ) {
      return;
    }

    setRecording(true);

    try {
      const combat = await addCombat({
        enemy_heroes: picks,
        my_heroes: editedTeam,
        won,
      });

      if (combat) {
        setCombats((prev) => [
          combat,
          ...prev,
        ]);
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
      setCombats((prev) =>
        prev.filter(
          (combat) =>
            combat.id !== id
        )
      );
    }
  }

  return {
    combats,
    setCombats,
    loadingHistory,
    recording,
    recordCombat,
    deleteCombat,
  };
}