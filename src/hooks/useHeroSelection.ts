import { useState } from "react";

import { reorderArray } from "../utils/selectionUtils";

const MAX_PICKS = 5;

export function useHeroSelection() {
  const [picks, setPicks] = useState<string[]>([]);
  const [editedTeam, setEditedTeam] = useState<string[]>([]);

  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapQuery, setSwapQuery] = useState("");

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function toggle(id: string, enabledHeroIds: Set<string>) {
    if (!enabledHeroIds.has(id)) {
      return;
    }

    setPicks((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length >= MAX_PICKS
        ? prev
        : [...prev, id]
    );
  }

  function reorderPicks(from: number, to: number) {
    setPicks((prev) => reorderArray(prev, from, to));
  }

  function reorderManual(
    arr: string[],
    setArr: (value: string[]) => void,
    from: number,
    to: number
  ) {
    setArr(reorderArray(arr, from, to));
  }

  function resetSelection() {
    setPicks([]);
    setEditedTeam([]);
    setSwapIndex(null);
    setSwapQuery("");
    setDragIndex(null);
    setDragOverIndex(null);
  }

  return {
    picks,
    setPicks,
    editedTeam,
    setEditedTeam,
    swapIndex,
    setSwapIndex,
    swapQuery,
    setSwapQuery,
    dragIndex,
    setDragIndex,
    dragOverIndex,
    setDragOverIndex,
    toggle,
    reorderPicks,
    reorderManual,
    resetSelection,
  };
}
