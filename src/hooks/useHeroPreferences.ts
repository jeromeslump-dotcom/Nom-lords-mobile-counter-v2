import { useEffect, useState } from "react";

import { HEROES, type Hero } from "../heroes";

import { loadHeroPreferences, saveHeroPreferences } from "../storage";

export function useHeroPreferences(user: any) {
  const [enabledHeroIds, setEnabledHeroIds] = useState<Set<string>>(
    () => new Set(HEROES.map((hero) => hero.id))
  );

  const [heroPreferencesLoaded, setHeroPreferencesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHeroSettings() {
      if (!user) {
        setHeroPreferencesLoaded(false);

        setEnabledHeroIds(new Set(HEROES.map((hero) => hero.id)));

        return;
      }

      setHeroPreferencesLoaded(false);

      const loadedPreferences = await loadHeroPreferences();

      if (cancelled) {
        return;
      }

      const disabledSet = new Set(loadedPreferences);

      const enabled = HEROES.filter((hero) => !disabledSet.has(hero.id)).map(
        (hero) => hero.id
      );

      setEnabledHeroIds(new Set(enabled));

      setHeroPreferencesLoaded(true);
    }

    loadHeroSettings();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !heroPreferencesLoaded) {
      return;
    }

    const disabledHeroes = HEROES.filter(
      (hero) => !enabledHeroIds.has(hero.id)
    ).map((hero) => hero.id);

    saveHeroPreferences(disabledHeroes).then((success) => {
      if (!success) {
        console.error(
          "Impossible de sauvegarder la configuration des héros dans Supabase."
        );
      }
    });
  }, [enabledHeroIds, user, heroPreferencesLoaded]);

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
    setEnabledHeroIds(new Set(HEROES.map((hero) => hero.id)));
  }

  function disableAllHeroes() {
    setEnabledHeroIds(new Set());
  }

  return {
    enabledHeroIds,
    setEnabledHeroIds,
    heroPreferencesLoaded,
    toggleHeroEnabled,
    enableAllHeroes,
    disableAllHeroes,
  };
}
