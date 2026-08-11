import { createClient } from "@supabase/supabase-js";

export interface Combat {
  id: string;
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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loadCombats(): Promise<Combat[]> {
  const { data, error } = await supabase
    .from("combats")
    .select("id, enemy_heroes, my_heroes, won, created_at")
    .order("created_at", { ascending: false });

if (error) {
console.error("Erreur chargement combats Supabase :", error);
return [];
}

  return (data ?? []) as Combat[];
}

export async function addCombat(
  input: Omit<Combat, "id" | "created_at">
): Promise<Combat | null> {
  const { data, error } = await supabase
    .from("combats")
    .insert({
      enemy_heroes: input.enemy_heroes,
      my_heroes: input.my_heroes,
      won: input.won,
    })
    .select("id, enemy_heroes, my_heroes, won, created_at")
    .single();

  if (error) {
    console.error("Erreur lors de l'enregistrement du combat :", error);
    return null;
  }

  return data as Combat;
}

export async function removeCombat(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("combats")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erreur lors de la suppression du combat :", error);
    return false;
  }

  return true;
}
