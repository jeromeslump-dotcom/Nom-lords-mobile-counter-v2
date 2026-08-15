from pathlib import Path
import shutil

APP = Path("src/App.tsx")

if not APP.exists():
    raise SystemExit("ERREUR : src/App.tsx introuvable.")

backup = Path("src/App.tsx.before_recommended_grid_match.bak")
shutil.copy2(APP, backup)

print(f"Sauvegarde créée : {backup}")

text = APP.read_text(encoding="utf-8")

old = (
    '<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">'
)

new = (
    '<div className="grid grid-cols-5 gap-2 sm:gap-3">'
)

if old not in text:
    raise SystemExit(
        "ERREUR : ancienne grille responsive Équipe recommandée introuvable."
    )

if text.count(old) != 1:
    raise SystemExit(
        f"ERREUR : grille trouvée {text.count(old)} fois au lieu de 1."
    )

text = text.replace(old, new, 1)

APP.write_text(text, encoding="utf-8")

print()
print("==============================================")
print("GRILLE EQUIPE RECOMMANDEE")
print("==============================================")
print()
print("OK : même grille que Ennemis choisis.")
print("OK : 5 cartes sur téléphone.")
print("OK : gap-2 sur mobile.")
print("OK : gap-3 à partir de sm.")
print("OK : X / Changer inchangé.")
print("OK : report inchangé.")
print("OK : heroes.ts inchangé.")
print("OK : counter.ts inchangé.")
print()
print("Lance maintenant :")
print("npm run build")
