import { createClient } from "@supabase/supabase-js";

export interface Combat {
  id: string;
  user_id: string;
  enemy_heroes: string[];
  my_heroes: string[];
  won: boolean;
  created_at: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables Supabase manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Erreur récupération utilisateur :", error);
    return null;
  }

  return user;
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function loadCombats(): Promise<Combat[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("combats")
    .select("id, user_id, enemy_heroes, my_heroes, won, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur lors du chargement des combats :", error);
    return [];
  }

  return (data ?? []) as Combat[];
}

export async function addCombat(
  input: Omit<Combat, "id" | "user_id" | "created_at">
): Promise<Combat | null> {
  const user = await getCurrentUser();

  if (!user) {
    console.error("Aucun utilisateur connecté.");
    return null;
  }

  const { data, error } = await supabase
    .from("combats")
    .insert({
      user_id: user.id,
      enemy_heroes: input.enemy_heroes,
      my_heroes: input.my_heroes,
      won: input.won,
    })
    .select("id, user_id, enemy_heroes, my_heroes, won, created_at")
    .single();

  if (error) {
    console.error("Erreur lors de l'enregistrement du combat :", error);
    return null;
  }

  return data as Combat;
}

export async function removeCombat(id: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const { error } = await supabase
    .from("combats")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erreur lors de la suppression du combat :", error);
    return false;
  }

  return true;
}