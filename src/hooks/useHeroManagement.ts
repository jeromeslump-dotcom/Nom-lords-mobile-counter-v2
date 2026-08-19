import { useEffect } from "react";

type UseHeroManagementParams = {
  enabledHeroIds: Set<string>;
  setEnabledHeroIds: React.Dispatch<
    React.SetStateAction<Set<string>>
  >;
  setPicks: React.Dispatch<
    React.SetStateAction<string[]>
  >;
  setEditedTeam: React.Dispatch<
    React.SetStateAction<string[]>
  >;
  setMEnemies: React.Dispatch<
    React.SetStateAction<string[]>
  >;
  setMMine: React.Dispatch<
    React.SetStateAction<string[]>
  >;
  setShowResult: React.Dispatch<
    React.SetStateAction<boolean>
  >;
};

export function useHeroManagement({
  enabledHeroIds,
  setEnabledHeroIds,
  setPicks,
  setEditedTeam,
  setMEnemies,
  setMMine,
  setShowResult,
}: UseHeroManagementParams) {
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
  }, [
    enabledHeroIds,
    setPicks,
    setEditedTeam,
    setMEnemies,
    setMMine,
  ]);

  const disableAllHeroes = () => {
    setEnabledHeroIds(new Set());
    setPicks([]);
    setEditedTeam([]);
    setMEnemies([]);
    setMMine([]);
    setShowResult(false);
  };

  return {
    disableAllHeroes,
  };
}