from pathlib import Path
import shutil

app = Path("src/App.tsx")
backup = Path("src/App.tsx.before_change_button_final.bak")

if not app.exists():
    raise SystemExit("ERREUR : src/App.tsx introuvable.")

text = app.read_text(encoding="utf-8")

shutil.copy2(app, backup)
print("Sauvegarde créée :", backup)


# =========================================================
# TROUVER LE BLOC "HEROS RETIRE"
# =========================================================

marker = 'Héros retiré'

pos = text.find(marker)

if pos == -1:
    # Le fichier peut être encodé bizarrement.
    marker = 'HÃ©ros retirÃ©'
    pos = text.find(marker)

if pos == -1:
    raise SystemExit("ERREUR : bloc Héros retiré introuvable.")

print("OK : bloc Héros retiré trouvé.")


# =========================================================
# TROUVER LE BOUTON RESTAURER DANS CE BLOC
# =========================================================

button_marker = "Restaurer"

button_pos = text.find(button_marker, pos)

if button_pos == -1:
    raise SystemExit(
        "ERREUR : bouton Restaurer introuvable après Héros retiré."
    )

print("OK : bouton Restaurer trouvé.")


# =========================================================
# TROUVER LE DEBUT DU BUTTON
# =========================================================

button_start = text.rfind("<button", pos, button_pos)

if button_start == -1:
    raise SystemExit(
        "ERREUR : ouverture du bouton introuvable."
    )


# =========================================================
# TROUVER LA FIN DU BUTTON
# =========================================================

button_end = text.find("</button>", button_pos)

if button_end == -1:
    raise SystemExit(
        "ERREUR : fermeture du bouton introuvable."
    )

button_end += len("</button>")


# =========================================================
# NOUVEAU BOUTON
# =========================================================

new_button = '''<button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSwapIndex(idx);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-[10px] text-cyan-300 hover:bg-cyan-400/20 transition-all"
                            >
                              Changer
                            </button>'''


text = (
    text[:button_start]
    + new_button
    + text[button_end:]
)


# =========================================================
# SAUVEGARDE
# =========================================================

app.write_text(text, encoding="utf-8")


print()
print("==============================================")
print("BOUTON CHANGER HERO")
print("==============================================")
print()
print("OK : Restaurer remplacé par Changer.")
print("OK : Changer appelle setSwapIndex(idx).")
print("OK : le Swap Modal existant est utilisé.")
print("OK : aucune modification de counter.ts.")
print("OK : logique de recommandation inchangée.")
print()
print("Lance maintenant :")
print("npm run build")