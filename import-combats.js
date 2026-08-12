
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURATION
// ============================================================

const CSV_FILE = path.join(__dirname, "CombatResult_550.csv");

// Les variables sont lues depuis .env.local
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const equalIndex = line.indexOf("=");

    if (equalIndex === -1) continue;

    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();

    // Retire les guillemets éventuels
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, ".env.local"));
loadEnvFile(path.join(__dirname, ".env"));

// ============================================================
// SUPABASE
// ============================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY introuvables."
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ============================================================
// IDENTIFIANTS HÉROS
// ============================================================

const HERO_ID_MAP = {
  "scarlet-bolt": "scarlet_bolt",
  "rose-knight": "rose_knight",
  "don-guappo": "don_guapo",
  "demon-slayer": "demon_slayer",
  "black-crow": "black_crow",
  "lore-weaver": "lore_weaver",
  "child-of-light": "child_of_light",
  "witch-doll": "witch_doll",
  "petite-devil": "petite_devil",
  "cursed-hunter": "cursed_hunter",
  "prima-donna": "prima_donna",
  "death-knight": "death_knight",
  "storm-fox": "storm_fox",
  "night-raven": "night_raven",
  "soul-forger": "soul_forger",
  "big-guy": "the_big_guy",
  "sage-of-storms": "sage_of_storms",
  "snow-queen": "snow_queen",
  "grove-guardian": "grove_guardian",
  "sea-squire": "sea_squire",
  "holy-sword": "holy_sword",
  "oath-keeper": "oath_keeper",
  "twilight-priestess": "twilight_priestess",
  "songstress-of-the-sea": "songstress_of_the_sea",
  "snail-princess": "snail_princess",
  "femme-fatale": "femme_fatale",
  "bombin-goblin": "bombin_goblin",
  "grim-wolf": "grim_wolf",
  "sand-sage": "sand_sage",
  "ethereal-guide": "ethereal_guide",
  "vengeful-centaur": "vengeful_centaur",
  "shapeshifter-cav": "shape_shifter"
};

function convertHeroId(id) {
  const clean = String(id || "").trim();

  return HERO_ID_MAP[clean] || clean.replace(/-/g, "_");
}

// ============================================================
// CSV PARSER
// ============================================================

function parseCSVLine(line) {
  const columns = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      columns.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  columns.push(current);

  return columns;
}

// ============================================================
// JSON DANS LES COLONNES
// ============================================================

function parseHeroArray(value) {
  if (!value) return [];

  let text = String(value).trim();

  try {
    return JSON.parse(text);
  } catch {
    // Tentative de nettoyage supplémentaire
    text = text.replace(/\\"/g, '"');

    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  }
}

// ============================================================
// LECTURE DU CSV
// ============================================================

if (!fs.existsSync(CSV_FILE)) {
  throw new Error(`Fichier CSV introuvable : ${CSV_FILE}`);
}

const csvContent = fs.readFileSync(CSV_FILE, "utf8");

const lines = csvContent
  .split(/\r?\n/)
  .filter((line) => line.trim() !== "");

if (lines.length < 2) {
  throw new Error("Le fichier CSV ne contient aucun combat.");
}

const headers = parseCSVLine(lines[0]).map((h) =>
  h.trim().replace(/^"|"$/g, "")
);

const resultIndex = headers.indexOf("result");
const teamIndex = headers.indexOf("team_hero_ids");
const enemyIndex = headers.indexOf("enemy_hero_ids");
const idIndex = headers.indexOf("id");
const createdDateIndex = headers.indexOf("created_date");

if (resultIndex === -1) {
  throw new Error("Colonne 'result' introuvable dans le CSV.");
}

if (teamIndex === -1) {
  throw new Error("Colonne 'team_hero_ids' introuvable dans le CSV.");
}

if (enemyIndex === -1) {
  throw new Error("Colonne 'enemy_hero_ids' introuvable dans le CSV.");
}

if (idIndex === -1) {
  throw new Error("Colonne 'id' introuvable dans le CSV.");
}

// ============================================================
// LECTURE DES COMBATS
// ============================================================

const combats = [];

let victories = 0;
let defeats = 0;
let invalidResults = 0;
let invalidTeams = 0;

for (let i = 1; i < lines.length; i++) {
  const columns = parseCSVLine(lines[i]);

  const result = String(columns[resultIndex] || "")
    .trim()
    .toLowerCase();

  const csvId = String(columns[idIndex] || "").trim();

  if (!csvId) {
    console.warn(`Ligne ${i + 1} ignorée : ID manquant.`);
    continue;
  }

  let won;

  if (result === "victoire" || result === "victory" || result === "win") {
    won = true;
    victories++;
  } else if (
    result === "defaite" ||
    result === "défaite" ||
    result === "defeat" ||
    result === "loss"
  ) {
    won = false;
    defeats++;
  } else {
    invalidResults++;

    console.warn(
      `Ligne ${i + 1} ignorée : résultat invalide (${result})`
    );

    continue;
  }

  const teamRaw = parseHeroArray(columns[teamIndex]);
  const enemyRaw = parseHeroArray(columns[enemyIndex]);

  const myHeroes = teamRaw.map(convertHeroId);
  const enemyHeroes = enemyRaw.map(convertHeroId);

  if (myHeroes.length !== 5 || enemyHeroes.length !== 5) {
    invalidTeams++;

    console.warn(
      `Ligne ${i + 1} ignorée : équipe invalide. Joueur=${myHeroes.length}, Ennemi=${enemyHeroes.length}`
    );

    continue;
  }

const createdDate =
  createdDateIndex !== -1
    ? String(columns[createdDateIndex] || "")
        .trim()
        .replace(/,(\d{3})$/, ".$1")
    : null;

  combats.push({
    csv_id: csvId,
    won,
    my_heroes: myHeroes,
    enemy_heroes: enemyHeroes,
    created_at: createdDate || null
  });
}

// ============================================================
// RÉSULTATS CSV
// ============================================================

console.log("");
console.log("============================================================");
console.log("                    RÉSULTATS");
console.log("============================================================");
console.log("");

console.log(
  `Combats présents dans le CSV : ${lines.length - 1}`
);

console.log(
  `Combats valides              : ${combats.length}`
);

console.log(`Victoires                    : ${victories}`);
console.log(`Défaites                     : ${defeats}`);
console.log(`Résultats invalides          : ${invalidResults}`);
console.log(`Équipes invalides            : ${invalidTeams}`);

console.log("");

if (victories + defeats === combats.length) {
  console.log("OK : victoires + défaites = combats valides");
} else {
  console.log("ATTENTION : incohérence dans les résultats.");
}

console.log("");

// ============================================================
// CONNEXION SUPABASE
// ============================================================

console.log("============================================================");
console.log("             CONNEXION SUPABASE");
console.log("============================================================");
console.log("");

const { data: existingRows, error: existingError } = await supabase
  .from("combats")
  .select("id, created_at, won, my_heroes, enemy_heroes")
  .order("created_at", { ascending: false });

if (existingError) {
  throw new Error(
    `Impossible de lire les combats Supabase : ${existingError.message}`
  );
}

const existingCombats = Array.isArray(existingRows)
  ? existingRows
  : [];

console.log(
  `Combats actuellement en base : ${existingCombats.length}`
);

console.log("");

// ============================================================
// DÉTECTION DES COMBATS DÉJÀ IMPORTÉS
// ============================================================
//
// IMPORTANT :
// On ne compare PAS simplement les équipes.
//
// Deux combats peuvent avoir les mêmes équipes mais être
// deux combats différents.
//
// On utilise donc l'ID du CSV lorsqu'il a déjà été enregistré.
//
// Comme la table actuelle ne possède pas de colonne csv_id,
// on utilise ici une signature comprenant :
// équipes + résultat + date.
//
// Cela permet d'éviter les réimportations accidentelles tout en
// conservant les combats réellement différents.
//

function normalizeDate(date) {
  if (!date) return "";

  const value = String(date).trim();

  // Supprime les éventuelles virgules millisecondes
  return value.replace(",", ".");
}

function combatSignature(combat) {
  const my = [...combat.my_heroes].sort().join("|");
  const enemy = [...combat.enemy_heroes].sort().join("|");
  const won = combat.won ? "1" : "0";
  const date = normalizeDate(combat.created_at);

  return `${my}::${enemy}::${won}::${date}`;
}

const existingSignatures = new Set();

for (const combat of existingCombats) {
  existingSignatures.add(
    combatSignature({
      my_heroes: Array.isArray(combat.my_heroes)
        ? combat.my_heroes
        : [],
      enemy_heroes: Array.isArray(combat.enemy_heroes)
        ? combat.enemy_heroes
        : [],
      won: combat.won,
      created_at: combat.created_at
    })
  );
}

// ============================================================
// PRÉPARATION DES NOUVEAUX COMBATS
// ============================================================

const newCombats = [];
let duplicates = 0;

for (const combat of combats) {
  const signature = combatSignature(combat);

  if (existingSignatures.has(signature)) {
    duplicates++;
    continue;
  }

  newCombats.push({
    enemy_heroes: combat.enemy_heroes,
    my_heroes: combat.my_heroes,
    won: combat.won,
    ...(combat.created_at
      ? { created_at: combat.created_at }
      : {})
  });

  // Empêche également les doublons à l'intérieur
  // du même import.
  existingSignatures.add(signature);
}

// ============================================================
// RÉSUMÉ
// ============================================================

console.log("============================================================");
console.log("                     RÉSUMÉ");
console.log("============================================================");
console.log("");

console.log(`Combats dans le CSV       : ${combats.length}`);
console.log(`Victoires CSV             : ${victories}`);
console.log(`Défaites CSV              : ${defeats}`);
console.log("");
console.log(`Déjà présents / doublons  : ${duplicates}`);
console.log(`Nouveaux combats          : ${newCombats.length}`);

console.log("");

// ============================================================
// IMPORT PAR LOTS
// ============================================================

if (newCombats.length === 0) {
  console.log("============================================================");
  console.log("                  PAS D'IMPORT");
  console.log("============================================================");
  console.log("");
  console.log("Aucun nouveau combat à importer.");
  console.log("");

  process.exit(0);
}

console.log("Début de l'import...");
console.log("");

const BATCH_SIZE = 100;

let imported = 0;

for (let i = 0; i < newCombats.length; i += BATCH_SIZE) {
  const batch = newCombats.slice(
    i,
    Math.min(i + BATCH_SIZE, newCombats.length)
  );

  const start = i + 1;
  const end = i + batch.length;

  console.log(
    `Import des combats ${start} à ${end} / ${newCombats.length}`
  );

  const { error } = await supabase
    .from("combats")
    .insert(batch);

  if (error) {
    throw new Error(
      `Erreur lors de l'import des combats ${start}-${end} : ${error.message}`
    );
  }

  imported += batch.length;
}

// ============================================================
// VÉRIFICATION FINALE
// ============================================================

const { count: finalCount, error: countError } = await supabase
  .from("combats")
  .select("*", {
    count: "exact",
    head: true
  });

if (countError) {
  throw new Error(
    `Impossible de compter les combats après import : ${countError.message}`
  );
}

console.log("");

console.log("============================================================");
console.log("                  IMPORT TERMINÉ");
console.log("============================================================");
console.log("");

console.log(`Combats du CSV          : ${combats.length}`);
console.log(`Déjà présents           : ${duplicates}`);
console.log(`Nouveaux importés       : ${imported}`);
console.log(`Total maintenant en DB  : ${finalCount}`);

console.log("");

const expectedMinimum = existingCombats.length + imported;

if (finalCount === expectedMinimum) {
  console.log("IMPORT VÉRIFIÉ : le nombre de combats en DB est cohérent.");
} else {
  console.log(
    `ATTENTION : total DB inattendu. Attendu au minimum : ${expectedMinimum}`
  );
}

console.log("");
