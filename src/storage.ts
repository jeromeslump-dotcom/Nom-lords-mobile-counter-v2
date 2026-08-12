

import { createClient } from "@supabase/supabase-js";

export interface Combat {
  id: string;
  user_id: string;
  enemy_heroes: string[];
  my_heroes: string[];
  won: boolean;
  created_at: string;
}

export interface HeroPreferences {
  user_id: string;
  disabled_heroes: string[];
}

/* -----------------------------------------------------------
 * CONFIGURATION SUPABASE
 * --------------------------------------------------------- */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables Supabase manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/* -----------------------------------------------------------
 * UTILITAIRES DE NORMALISATION
 * --------------------------------------------------------- */

/**
 * Transforme une valeur Supabase en tableau de chaînes sûr.
 *
 * Accepte :
 *   ["hero1", "hero2"]
 *   '["hero1","hero2"]'
 *   null
 *   undefined
 *   autre valeur
 *
 * Retourne TOUJOURS string[].
 */
function normalizeHeroArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (id): id is string =>
        typeof id === "string" && id.trim().length > 0
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (id): id is string =>
            typeof id === "string" && id.trim().length > 0
        );
      }
    } catch {
      // Valeur non JSON : on retourne simplement []
    }
  }

  return [];
}

/**
 * Vérifie et normalise un combat provenant de Supabase.
 *
 * L'objectif est que App.tsx puisse toujours faire :
 *
 *   c.enemy_heroes.filter(...)
 *   c.my_heroes.filter(...)
 *   for (const id of c.enemy_heroes)
 *
 * sans provoquer de crash.
 */
function normalizeCombat(value: unknown): Combat | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;

  if (typeof row.id !== "string") {
    return null;
  }

  if (typeof row.user_id !== "string") {
    return null;
  }

  const enemyHeroes = normalizeHeroArray(row.enemy_heroes);
  const myHeroes = normalizeHeroArray(row.my_heroes);

  if (typeof row.won !== "boolean") {
    return null;
  }

  if (typeof row.created_at !== "string") {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    enemy_heroes: enemyHeroes,
    my_heroes: myHeroes,
    won: row.won,
    created_at: row.created_at,
  };
}

/**
 * Normalise toute la réponse Supabase.
 *
 * Une ligne invalide est ignorée plutôt que de faire planter
 * toute l'application.
 */
function normalizeCombats(data: unknown): Combat[] {
  if (!Array.isArray(data)) {
    return [];
  }

  const result: Combat[] = [];

  for (const row of data) {
    const combat = normalizeCombat(row);

    if (combat) {
      result.push(combat);
    } else {
      console.warn(
        "Combat Supabase ignoré car ses données sont invalides :",
        row
      );
    }
  }

  return result;
}

/* -----------------------------------------------------------
 * UTILISATEUR
 * --------------------------------------------------------- */

export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error(
        "Erreur récupération utilisateur :",
        error
      );

      return null;
    }

    return user;
  } catch (error) {
    console.error(
      "Erreur inattendue récupération utilisateur :",
      error
    );

    return null;
  }
}

/* -----------------------------------------------------------
 * CONNEXION
 * --------------------------------------------------------- */

export async function signIn(
  email: string,
  password: string
) {
  try {
    return await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
  } catch (error) {
    console.error(
      "Erreur inattendue lors de la connexion :",
      error
    );

    return {
      data: {
        user: null,
        session: null,
      },
      error: error instanceof Error
        ? error
        : new Error("Erreur de connexion"),
    };
  }
}

/* -----------------------------------------------------------
 * DÉCONNEXION
 * --------------------------------------------------------- */

export async function signOut() {
  try {
    return await supabase.auth.signOut();
  } catch (error) {
    console.error(
      "Erreur inattendue lors de la déconnexion :",
      error
    );

    return {
      error:
        error instanceof Error
          ? error
          : new Error("Erreur de déconnexion"),
    };
  }
}

/* -----------------------------------------------------------
 * COMBATS — CHARGEMENT
 * --------------------------------------------------------- */

export async function loadCombats(): Promise<Combat[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  try {
    const {
      data,
      error,
    } = await supabase
      .from("combats")
      .select(
        "id, user_id, enemy_heroes, my_heroes, won, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Erreur lors du chargement des combats :",
        error
      );

      return [];
    }

    /*
     * IMPORTANT :
     * Ne jamais retourner directement `data as Combat[]`.
     *
     * Les données Supabase sont normalisées avant d'être
     * transmises à App.tsx.
     */
    return normalizeCombats(data);
  } catch (error) {
    console.error(
      "Erreur inattendue lors du chargement des combats :",
      error
    );

    return [];
  }
}

/* -----------------------------------------------------------
 * COMBATS — AJOUT
 * --------------------------------------------------------- */

export async function addCombat(
  input: Omit<
    Combat,
    "id" | "user_id" | "created_at"
  >
): Promise<Combat | null> {
  const user = await getCurrentUser();

  if (!user) {
    console.error(
      "Aucun utilisateur connecté."
    );

    return null;
  }

  /*
   * Nettoyage avant insertion.
   */
  const enemyHeroes = normalizeHeroArray(
    input.enemy_heroes
  );

  const myHeroes = normalizeHeroArray(
    input.my_heroes
  );

  /*
   * Un combat valide doit normalement contenir
   * exactement 5 héros dans chaque équipe.
   *
   * On ne bloque toutefois pas l'insertion ici :
   * la base peut contenir des combats historiques
   * différents selon les anciennes données.
   */
  if (enemyHeroes.length === 0 || myHeroes.length === 0) {
    console.error(
      "Impossible d'enregistrer un combat sans héros."
    );

    return null;
  }

  if (typeof input.won !== "boolean") {
    console.error(
      "Résultat du combat invalide."
    );

    return null;
  }

  try {
    const {
      data,
      error,
    } = await supabase
      .from("combats")
      .insert({
        user_id: user.id,
        enemy_heroes: enemyHeroes,
        my_heroes: myHeroes,
        won: input.won,
      })
      .select(
        "id, user_id, enemy_heroes, my_heroes, won, created_at"
      )
      .single();

    if (error) {
      console.error(
        "Erreur lors de l'enregistrement du combat :",
        error
      );

      return null;
    }

    /*
     * Même après insertion, on normalise la réponse.
     */
    return normalizeCombat(data);
  } catch (error) {
    console.error(
      "Erreur inattendue lors de l'enregistrement du combat :",
      error
    );

    return null;
  }
}

/* -----------------------------------------------------------
 * COMBATS — SUPPRESSION
 * --------------------------------------------------------- */

export async function removeCombat(
  id: string
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    console.error(
      "Aucun utilisateur connecté."
    );

    return false;
  }

  if (!id || typeof id !== "string") {
    console.error(
      "Identifiant de combat invalide."
    );

    return false;
  }

  try {
    const {
      error,
    } = await supabase
      .from("combats")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Erreur lors de la suppression du combat :",
        error
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Erreur inattendue lors de la suppression du combat :",
      error
    );

    return false;
  }
}

/* -----------------------------------------------------------
 * PRÉFÉRENCES DES HÉROS — CHARGEMENT
 * --------------------------------------------------------- */

export async function loadHeroPreferences(): Promise<
  string[]
> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  try {
    const {
      data,
      error,
    } = await supabase
      .from("hero_preferences")
      .select("disabled_heroes")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Erreur lors du chargement des préférences héros :",
        error
      );

      return [];
    }

    if (!data) {
      return [];
    }

    return normalizeHeroArray(
      data.disabled_heroes
    );
  } catch (error) {
    console.error(
      "Erreur inattendue lors du chargement des préférences héros :",
      error
    );

    return [];
  }
}

/* -----------------------------------------------------------
 * PRÉFÉRENCES DES HÉROS — SAUVEGARDE
 * --------------------------------------------------------- */

export async function saveHeroPreferences(
  disabledHeroes: string[]
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    console.error(
      "Aucun utilisateur connecté."
    );

    return false;
  }

  /*
   * Nettoyage :
   * - uniquement les chaînes
   * - suppression des valeurs vides
   * - suppression des doublons
   */
  const cleanedHeroes = [
    ...new Set(
      normalizeHeroArray(disabledHeroes)
    ),
  ];

  try {
    const {
      error,
    } = await supabase
      .from("hero_preferences")
      .upsert(
        {
          user_id: user.id,
          disabled_heroes: cleanedHeroes,
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      console.error(
        "Erreur lors de la sauvegarde des préférences héros :",
        error
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Erreur inattendue lors de la sauvegarde des préférences héros :",
      error
    );

    return false;
  }
}
