from pathlib import Path

path = Path("src/App.tsx")
text = path.read_text(encoding="utf-8")

replacements = {
    "Aucun héros ne correspond \u00c3\u00a0 ta recherche.": "Aucun héros ne correspond \u00e0 ta recherche.",
    "\u00f0\u0178\u201d Administration": "\U0001f512 Administration",
    "Connexion réservée \u00c3\u00a0": "Connexion réservée \u00e0",
    "\u00f0\u0178\u201d Admin": "\U0001f512 Admin",
    "🔒 Historique et enregistrement réservés \u00c3\u00a0 l'Admin": "🔒 Historique et enregistrement réservés \u00e0 l'Admin",
    "d'un combat déj\u00c3\u00a0 joué pour améliorer": "d'un combat déjà joué pour améliorer",
}

changed = 0

for old, new in replacements.items():
    count = text.count(old)
    if count:
        text = text.replace(old, new)
        changed += count
        print(f"OK : {count} remplacement(s)")
    else:
        print("INFO : chaîne absente")

path.write_text(text, encoding="utf-8", newline="\n")

print()
print("=" * 60)
print(f"TERMINE : {changed} remplacement(s)")
print("=" * 60)