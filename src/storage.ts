export interface Combat {
  id: string;
  enemy_heroes: string[];
  my_heroes: string[];
  won: boolean;
  created_at: string;
}

const KEY = "lords-mobile-counter-v2-combats";

function read(): Combat[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadCombats(): Combat[] {
  return read().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveCombats(combats: Combat[]) {
  localStorage.setItem(KEY, JSON.stringify(combats));
}

export function addCombat(input: Omit<Combat, "id" | "created_at">): Combat {
  const combat: Combat = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  saveCombats([combat, ...read()]);
  return combat;
}

export function removeCombat(id: string) {
  saveCombats(read().filter((c) => c.id !== id));
}
