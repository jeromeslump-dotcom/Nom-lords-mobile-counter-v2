from pathlib import Path
import shutil
import re

ROOT = Path(__file__).resolve().parent
APP = ROOT / "src" / "App.tsx"
HEROES = ROOT / "src" / "heroes.ts"
COUNTER = ROOT / "src" / "counter.ts"

print("=" * 60)
print("NETTOYAGE GENERAL DU PROJET")
print("=" * 60)
print()

# ------------------------------------------------------------
# VÃ©rifications
# ------------------------------------------------------------

if not APP.exists():
    raise SystemExit("ERREUR : src/App.tsx introuvable.")

if not HEROES.exists():
    raise SystemExit("ERREUR : src/heroes.ts introuvable.")

if not COUNTER.exists():
    raise SystemExit("ERREUR : src/counter.ts introuvable.")

# ------------------------------------------------------------
# Sauvegardes
# ------------------------------------------------------------

app_backup = APP.with_name("App.tsx.before_general_cleanup.bak")
heroes_backup = HEROES.with_name("heroes.ts.before_general_cleanup.bak")

shutil.copy2(APP, app_backup)
shutil.copy2(HEROES, heroes_backup)

print(f"OK : sauvegarde App.tsx  -> {app_backup}")
print(f"OK : sauvegarde heroes.ts -> {heroes_backup}")
print()

# ------------------------------------------------------------
# Lecture
# ------------------------------------------------------------

app_text = APP.read_text(encoding="utf-8")
heroes_text = HEROES.read_text(encoding="utf-8")

original_app = app_text
original_heroes = heroes_text

# ------------------------------------------------------------
# 1. Suppression des TEST 1 / TEST 2 / etc.
# ------------------------------------------------------------

test_patterns = [
    r'^\s*TEST\s+[1-9]\d*\s*$',
    r'^\s*TEST\s+[A-Z]\s*$',
]

removed_tests = 0

lines = app_text.splitlines(keepends=True)
new_lines = []

for line in lines:
    stripped = line.strip()

    remove = False

    for pattern in test_patterns:
        if re.match(pattern, stripped):
            remove = True
            break

    if remove:
        removed_tests += 1
    else:
        new_lines.append(line)

app_text = "".join(new_lines)

if removed_tests:
    print(f"OK : {removed_tests} ligne(s) TEST supprimÃ©e(s).")
else:
    print("INFO : aucun TEST rÃ©siduel trouvÃ©.")

# ------------------------------------------------------------
# 2. Nettoyage des caractÃ¨res mal encodÃ©s
# ------------------------------------------------------------

encoding_fixes = {
    "HÃƒÂ©ros": "HÃ©ros",
    "hÃƒÂ©ros": "hÃ©ros",
    "RÃƒÂ©initialiser": "RÃ©initialiser",
    "rÃƒÂ©initialiser": "rÃ©initialiser",
    "RÃƒÂ©initialisÃƒÂ©": "RÃ©initialisÃ©",
    "rÃƒÂ©initialisÃƒÂ©": "rÃ©initialisÃ©",
    "ÃƒÂ©": "Ã©",
    "ÃƒÂ¨": "Ã¨",
    "ÃƒÂª": "Ãª",
    "ÃƒÂ«": "Ã«",
    "Ãƒ ": "Ã ",
    "ÃƒÂ¢": "Ã¢",
    "ÃƒÂ®": "Ã®",
    "ÃƒÂ¯": "Ã¯",
    "ÃƒÂ´": "Ã´",
    "ÃƒÂ»": "Ã»",
    "ÃƒÂ¼": "Ã¼",
    "ÃƒÂ§": "Ã§",
    "Ãƒâ€°": "Ã‰",
    "Ãƒâ‚¬": "Ã€",
    "ÃƒË†": "Ãˆ",
    "Ãƒâ€š": "Ã‚",
    "ÃƒÅ½": "ÃŽ",
    "Ãƒâ€": "Ã”",
    "Ãƒâ€º": "Ã›",
    "Ãƒâ€”": "Ã—",
    "Ã¢Å¡â„¢Ã¯Â¸": "âš™ï¸",
    "Ã°Å¸â€ºÂ¡Ã¯Â¸": "ðŸ›¡ï¸",
    "Ã°Å¸Å½": "ðŸŽ",
    "Ã°Å¸Â¹": "ðŸ¹",
}

encoding_count = 0

for bad, good in encoding_fixes.items():
    count = app_text.count(bad)
    if count:
        app_text = app_text.replace(bad, good)
        encoding_count += count
        print(f"OK : encodage corrigÃ© : {bad!r} -> {good!r} ({count} occurrence(s))")

if encoding_count == 0:
    print("INFO : aucun problÃ¨me d'encodage connu trouvÃ©.")

# ------------------------------------------------------------
# 3. VÃ©rification des images de hÃ©ros en 50 px
# ------------------------------------------------------------

# On ne modifie pas toutes les URLs aveuglÃ©ment.
# On remplace uniquement scale-to-width-down/50 par /200
# dans heroes.ts.

count_50 = heroes_text.count("scale-to-width-down/50")

if count_50:
    heroes_text = heroes_text.replace(
        "scale-to-width-down/50",
        "scale-to-width-down/200"
    )
    print(
        f"OK : {count_50} image(s) heroes.ts passÃ©e(s) "
        "de 50 px Ã  200 px."
    )
else:
    print("INFO : aucune image scale-to-width-down/50 trouvÃ©e.")

# ------------------------------------------------------------
# 4. VÃ©rification de Stellina
# ------------------------------------------------------------

stellina_pattern = re.compile(
    r'(\{\s*id:\s*"stellina_unicorno".*?img:\s*)"([^"]+)"',
    re.DOTALL
)

match = stellina_pattern.search(heroes_text)

if match:
    current_path = match.group(2)

    if current_path != "/heroes/stellina.jpg":
        heroes_text = (
            heroes_text[:match.start(2)]
            + "/heroes/stellina.jpg"
            + heroes_text[match.end(2):]
        )

        print(
            "OK : Stellina utilise maintenant "
            "/heroes/stellina.jpg"
        )
    else:
        print(
            "OK : Stellina utilise dÃ©jÃ  "
            "/heroes/stellina.jpg"
        )
else:
    print(
        "ATTENTION : entrÃ©e stellina_unicorno introuvable."
    )

# ------------------------------------------------------------
# 5. VÃ©rification de l'image locale Stellina
# ------------------------------------------------------------

stellina_image = ROOT / "public" / "heroes" / "stellina.jpg"

if stellina_image.exists():
    print(
        f"OK : image locale Stellina prÃ©sente "
        f"({stellina_image.stat().st_size} octets)."
    )
else:
    print(
        "ATTENTION : public/heroes/stellina.jpg "
        "n'existe pas."
    )

# ------------------------------------------------------------
# 6. SÃ©curitÃ© : counter.ts ne doit jamais Ãªtre modifiÃ©
# ------------------------------------------------------------

print()
print("OK : counter.ts NON MODIFIE.")

# ------------------------------------------------------------
# Ã‰criture uniquement si nÃ©cessaire
# ------------------------------------------------------------

app_changed = app_text != original_app
heroes_changed = heroes_text != original_heroes

if app_changed:
    APP.write_text(app_text, encoding="utf-8")
    print("OK : src/App.tsx nettoyÃ©.")
else:
    print("INFO : src/App.tsx dÃ©jÃ  propre.")

if heroes_changed:
    HEROES.write_text(heroes_text, encoding="utf-8")
    print("OK : src/heroes.ts nettoyÃ©.")
else:
    print("INFO : src/heroes.ts dÃ©jÃ  propre.")

# ------------------------------------------------------------
# RÃ©sumÃ©
# ------------------------------------------------------------

print()
print("=" * 60)
print("NETTOYAGE TERMINE")
print("=" * 60)
print()
print("Modifications :")
print(f"  App.tsx   : {'OUI' if app_changed else 'NON'}")
print(f"  heroes.ts : {'OUI' if heroes_changed else 'NON'}")
print("  counter.ts: NON")
print()
print("Sauvegardes conservÃ©es :")
print(f"  {app_backup.name}")
print(f"  {heroes_backup.name}")
print()
print("Lance maintenant :")
print("  npm run build")
print()
print("Puis :")
print("  git status")
print()
