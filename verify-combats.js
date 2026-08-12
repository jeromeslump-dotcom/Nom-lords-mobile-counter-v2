
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// FICHIERS
// ============================================================

const CSV_FILE = path.join(__dirname, "CombatResult_550.csv");
const HEROES_FILE = path.join(__dirname, "src", "heroes.ts");

// ============================================================
// VERIFICATION DES FICHIERS
// ============================================================

if (!fs.existsSync(CSV_FILE)) {
  throw new Error(`Fichier introuvable : ${CSV_FILE}`);
}

if (!fs.existsSync(HEROES_FILE)) {
  throw new Error(`Fichier introuvable : ${HEROES_FILE}`);
}

// ============================================================
// LECTURE DES HEROS DE heroes.ts
// ============================================================

const heroesSource = fs.readFileSync(HEROES_FILE, "utf8");

const heroIds = new Set();

const idRegex = /\bid:\s*"([^"]+)"/g;

let match;

while ((match = idRegex.exec(heroesSource)) !== null) {
  heroIds.add(match[1]);
}

if (heroIds.size === 0) {
  throw new Error(
    "Impossible de trouver les IDs des héros dans src/heroes.ts"
  );
}

// ============================================================
// NORMALISATION
// ============================================================

function normalizeId(value) {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// ============================================================
// ALIAS DES ANCIENS IDS
// ============================================================

const ALIASES = {
  "don-guappo": "don_guapo",
  "big-guy": "the_big_guy",
  "shapeshifter-cav": "shape_shifter",
};

// ============================================================
// TABLE DE CORRESPONDANCE
// ============================================================

const normalizedHeroes = new Map();

for (const id of heroIds) {
  normalizedHeroes.set(normalizeId(id), id);
}

for (const [oldId, newId] of Object.entries(ALIASES)) {
  if (heroIds.has(newId)) {
    normalizedHeroes.set(normalizeId(oldId), newId);
  }
}

// ============================================================
// RESOLUTION D'UN HERO
// ============================================================

function resolveHeroId(value) {
  if (!value) return null;

  const original = String(value).trim();

  // ID actuel exact
  if (heroIds.has(original)) {
    return original;
  }

  // Correspondance normalisée
  const normalized = normalizeId(original);

  if (normalizedHeroes.has(normalized)) {
    return normalizedHeroes.get(normalized);
  }

  return null;
}

// ============================================================
// PARSEUR CSV
// ============================================================

function parseCSVLine(line) {
  const result = [];

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
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);

  return result.map((value) => value.trim());
}

// ============================================================
// LECTURE DU CSV
// ============================================================

const csv = fs.readFileSync(CSV_FILE, "utf8");

const lines = csv
  .split(/\r?\n/)
  .filter((line) => line.trim() !== "");

if (lines.length < 2) {
  throw new Error("Le CSV ne contient aucune donnée.");
}

const headers = parseCSVLine(lines[0]).map((header) =>
  header.replace(/^"|"$/g, "").trim()
);

const rows = [];

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);

  const row = {};

  headers.forEach((header, index) => {
    row[header] = values[index] ?? "";
  });

  rows.push(row);
}

// ============================================================
// VERIFICATION DES COLONNES
// ============================================================

const requiredColumns = [
  "result",
  "team_hero_ids",
  "enemy_hero_ids",
];

for (const column of requiredColumns) {
  if (!headers.includes(column)) {
    throw new Error(
      `Colonne obligatoire absente du CSV : ${column}`
    );
  }
}

// ============================================================
// STATISTIQUES
// ============================================================

let victories = 0;
let defeats = 0;

let combatsOK = 0;
let combatsProblematiques = 0;

let badResult = 0;
let badTeamSize = 0;
let badEnemySize = 0;
let duplicateTeam = 0;
let duplicateEnemy = 0;

const unknownHeroes = new Map();
const convertedHeroes = new Map();

const problematicCombats = [];

// ============================================================
// UTILITAIRES
// ============================================================

function addUnknown(heroId) {
  if (!heroId) return;

  unknownHeroes.set(
    heroId,
    (unknownHeroes.get(heroId) || 0) + 1
  );
}

function addConverted(original, resolved) {
  if (!original || !resolved || original === resolved) {
    return;
  }

  const key = `${original} -> ${resolved}`;

  convertedHeroes.set(
    key,
    (convertedHeroes.get(key) || 0) + 1
  );
}

function hasDuplicates(array) {
  return new Set(array).size !== array.length;
}

function parseHeroArray(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return null;
  }
}

// ============================================================
// ANALYSE DES COMBATS
// ============================================================

for (let index = 0; index < rows.length; index++) {
  const row = rows[index];

  const combatNumber = index + 1;

  const result = String(row.result || "")
    .trim()
    .toLowerCase();

  // ----------------------------------------------------------
  // RESULTAT
  // ----------------------------------------------------------

  if (result === "victoire") {
    victories++;
  } else if (result === "defaite") {
    defeats++;
  } else {
    badResult++;
  }

  // ----------------------------------------------------------
  // EQUIPES
  // ----------------------------------------------------------

  const rawTeam = parseHeroArray(row.team_hero_ids);
  const rawEnemy = parseHeroArray(row.enemy_hero_ids);

  let combatProblem = false;

  if (!rawTeam) {
    combatProblem = true;

    problematicCombats.push({
      combat: combatNumber,
      reason: "team_hero_ids invalide",
    });

    continue;
  }

  if (!rawEnemy) {
    combatProblem = true;

    problematicCombats.push({
      combat: combatNumber,
      reason: "enemy_hero_ids invalide",
    });

    continue;
  }

  // ----------------------------------------------------------
  // NOMBRE DE HEROS
  // ----------------------------------------------------------

  if (rawTeam.length !== 5) {
    badTeamSize++;
    combatProblem = true;

    problematicCombats.push({
      combat: combatNumber,
      reason: `équipe joueur = ${rawTeam.length} héros`,
    });
  }

  if (rawEnemy.length !== 5) {
    badEnemySize++;
    combatProblem = true;

    problematicCombats.push({
      combat: combatNumber,
      reason: `équipe ennemie = ${rawEnemy.length} héros`,
    });
  }

  // ----------------------------------------------------------
  // DOUBLONS
  // ----------------------------------------------------------

  if (hasDuplicates(rawTeam)) {
    duplicateTeam++;
    combatProblem = true;

    problematicCombats.push({
      combat: combatNumber,
      reason: "doublon dans l'équipe joueur",
    });
  }

  if (hasDuplicates(rawEnemy)) {
    duplicateEnemy++;
    combatProblem = true;

    problematicCombats.push({
      combat: combatNumber,
      reason: "doublon dans l'équipe ennemie",
    });
  }

  // ----------------------------------------------------------
  // RESOLUTION DES HEROS
  // ----------------------------------------------------------

  for (const rawHero of [...rawTeam, ...rawEnemy]) {
    const resolved = resolveHeroId(rawHero);

    if (!resolved) {
      addUnknown(rawHero);
      combatProblem = true;
    } else {
      addConverted(rawHero, resolved);
    }
  }

  // ----------------------------------------------------------
  // RESULTAT FINAL DU COMBAT
  // ----------------------------------------------------------

  if (combatProblem) {
    combatsProblematiques++;
  } else {
    combatsOK++;
  }
}

// ============================================================
// AFFICHAGE
// ============================================================

console.log("");
console.log("============================================================");
console.log("              VÉRIFICATION DES COMBATS");
console.log("============================================================");
console.log("");

console.log(
  `Héros dans heroes.ts       : ${heroIds.size}`
);

console.log(
  `Combats analysés           : ${rows.length}`
);

console.log("");

console.log("------------------------------------------------------------");
console.log("RÉSULTATS");
console.log("------------------------------------------------------------");

console.log(
  `Victoires                  : ${victories}`
);

console.log(
  `Défaites                   : ${defeats}`
);

console.log(
  `Combats OK                 : ${combatsOK}`
);

console.log(
  `Combats problématiques     : ${combatsProblematiques}`
);

console.log(
  `Héros réellement inconnus  : ${unknownHeroes.size}`
);

console.log("");

// ============================================================
// CONTROLE VICTOIRES / DEFAITES
// ============================================================

if (victories + defeats === rows.length) {
  console.log(
    "OK : victoires + défaites = nombre total de combats."
  );
} else {
  console.log(
    `ATTENTION : victoires + défaites = ${
      victories + defeats
    } / ${rows.length}`
  );
}

console.log("");

// ============================================================
// CONTROLE DES EQUIPES
// ============================================================

console.log("------------------------------------------------------------");
console.log("CONTRÔLES DES COMBATS");
console.log("------------------------------------------------------------");

console.log(
  `Résultats invalides        : ${badResult}`
);

console.log(
  `Équipes joueur ≠ 5 héros   : ${badTeamSize}`
);

console.log(
  `Équipes ennemies ≠ 5 héros : ${badEnemySize}`
);

console.log(
  `Doublons équipe joueur     : ${duplicateTeam}`
);

console.log(
  `Doublons équipe ennemie    : ${duplicateEnemy}`
);

console.log("");

// ============================================================
// CONVERSIONS
// ============================================================

if (convertedHeroes.size > 0) {
  console.log("------------------------------------------------------------");
  console.log("IDENTIFIANTS CONVERTIS");
  console.log("------------------------------------------------------------");
  console.log("");

  const sortedConversions = [...convertedHeroes.entries()]
    .sort((a, b) => b[1] - a[1]);

  for (const [conversion, count] of sortedConversions) {
    console.log(
      `- ${conversion} : ${count} occurrence(s)`
    );
  }

  console.log("");
}

// ============================================================
// HEROS INCONNUS
// ============================================================

if (unknownHeroes.size > 0) {
  console.log("------------------------------------------------------------");
  console.log("HÉROS RÉELLEMENT INCONNUS");
  console.log("------------------------------------------------------------");
  console.log("");

  const sortedUnknown = [...unknownHeroes.entries()]
    .sort((a, b) => b[1] - a[1]);

  for (const [heroId, count] of sortedUnknown) {
    console.log(
      `* ${heroId} : ${count} occurrence(s)`
    );
  }

  console.log("");
} else {
  console.log("AUCUN HÉROS INCONNU.");
  console.log("");
}

// ============================================================
// COMBATS PROBLEMATIQUES
// ============================================================

if (problematicCombats.length > 0) {
  console.log("------------------------------------------------------------");
  console.log("COMBATS PROBLÉMATIQUES");
  console.log("------------------------------------------------------------");
  console.log("");

  for (const problem of problematicCombats.slice(0, 30)) {
    console.log(
      `Combat #${problem.combat} : ${problem.reason}`
    );
  }

  if (problematicCombats.length > 30) {
    console.log("");
    console.log(
      `... et ${
        problematicCombats.length - 30
      } autre(s).`
    );
  }

  console.log("");
}

// ============================================================
// FIN
// ============================================================

console.log("============================================================");
console.log("Vérification terminée.");
console.log("============================================================");
console.log("");
