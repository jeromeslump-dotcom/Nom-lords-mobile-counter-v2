import { createClient } from "@supabase/supabase-js";

export type UserRole = "user" | "contributor" | "admin";

export interface UserProfile {
  id: string;
  display_name: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Combat {
  id: string;
  user_id: string;
  created_by: string;
  status: "active" | "removed";
  enemy_heroes: string[];
  my_heroes: string[];
  won: boolean;
  created_at: string;
}

export interface HeroPreferences {
  user_id: string;
  disabled_heroes: string[];
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables Supabase manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function normalizeHeroArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0
        );
      }
    } catch {
      // Valeur non JSON.
    }
  }

  return [];
}

function normalizeCombat(value: unknown): Combat | null {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;

  if (
    typeof row.id !== "string" ||
    typeof row.user_id !== "string" ||
    typeof row.created_by !== "string" ||
    (row.status !== "active" && row.status !== "removed") ||
    typeof row.won !== "boolean" ||
    typeof row.created_at !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    created_by: row.created_by,
    status: row.status,
    enemy_heroes: normalizeHeroArray(row.enemy_heroes),
    my_heroes: normalizeHeroArray(row.my_heroes),
    won: row.won,
    created_at: row.created_at,
  };
}

function normalizeCombats(data: unknown): Combat[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    const combat = normalizeCombat(row);
    if (!combat) {
      console.warn("Combat Supabase ignoré car ses données sont invalides :", row);
      return [];
    }
    return [combat];
  });
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Une absence de session est normale pour un visiteur.
      if (error.name !== "AuthSessionMissingError") {
        console.error("Erreur récupération utilisateur :", error);
      }
      return null;
    }
    return user;
  } catch (error) {
    console.error("Erreur inattendue récupération utilisateur :", error);
    return null;
  }
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, role, active, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Erreur récupération profil :", error);
      return null;
    }

    if (!data) return null;

    if (
      data.role !== "user" &&
      data.role !== "contributor" &&
      data.role !== "admin"
    ) {
      console.error("Rôle utilisateur invalide :", data.role);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error("Erreur inattendue récupération profil :", error);
    return null;
  }
}

export async function signIn(email: string, password: string) {
  try {
    return await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
  } catch (error) {
    console.error("Erreur inattendue lors de la connexion :", error);
    return {
      data: { user: null, session: null },
      error: error instanceof Error ? error : new Error("Erreur de connexion"),
    };
  }
}

export async function signOut() {
  try {
    return await supabase.auth.signOut();
  } catch (error) {
    console.error("Erreur inattendue lors de la déconnexion :", error);
    return {
      error: error instanceof Error ? error : new Error("Erreur de déconnexion"),
    };
  }
}

export async function loadCombats(): Promise<Combat[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from("combats")
      .select(
        "id, user_id, created_by, status, enemy_heroes, my_heroes, won, created_at"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors du chargement des combats :", error);
      return [];
    }

    return normalizeCombats(data);
  } catch (error) {
    console.error("Erreur inattendue lors du chargement des combats :", error);
    return [];
  }
}

export async function addCombat(
  input: Omit<Combat, "id" | "user_id" | "created_by" | "status" | "created_at">
): Promise<Combat | null> {
  const user = await getCurrentUser();
  if (!user) {
    console.error("Aucun utilisateur connecté.");
    return null;
  }

  const enemyHeroes = normalizeHeroArray(input.enemy_heroes);
  const myHeroes = normalizeHeroArray(input.my_heroes);

  if (enemyHeroes.length === 0 || myHeroes.length === 0) {
    console.error("Impossible d'enregistrer un combat sans héros.");
    return null;
  }

  if (typeof input.won !== "boolean") {
    console.error("Résultat du combat invalide.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("combats")
      .insert({
        user_id: user.id,
        created_by: user.id,
        status: "active",
        enemy_heroes: enemyHeroes,
        my_heroes: myHeroes,
        won: input.won,
      })
      .select(
        "id, user_id, created_by, status, enemy_heroes, my_heroes, won, created_at"
      )
      .single();

    if (error) {
      console.error("Erreur lors de l'enregistrement du combat :", error);
      return null;
    }

    return normalizeCombat(data);
  } catch (error) {
    console.error("Erreur inattendue lors de l'enregistrement du combat :", error);
    return null;
  }
}

export async function removeCombat(id: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !id || typeof id !== "string") return false;

  try {
    const { error } = await supabase
      .from("combats")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erreur lors de la suppression du combat :", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur inattendue lors de la suppression du combat :", error);
    return false;
  }
}

export async function loadHeroPreferences(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const { data, error } = await supabase
      .from("hero_settings")
      .select("excluded_hero_ids")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Erreur lors du chargement des préférences héros :", error);
      return [];
    }

    return data ? normalizeHeroArray(data.excluded_hero_ids) : [];
  } catch (error) {
    console.error("Erreur inattendue lors du chargement des préférences héros :", error);
    return [];
  }
}

export async function saveHeroPreferences(disabledHeroes: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const cleanedHeroes = [...new Set(normalizeHeroArray(disabledHeroes))];

  try {
    const { error } = await supabase
      .from("hero_settings")
      .upsert(
        { user_id: user.id, excluded_hero_ids: cleanedHeroes },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Erreur lors de la sauvegarde des préférences héros :", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erreur inattendue lors de la sauvegarde des préférences héros :", error);
    return false;
  }
}
