# V2 — lancement sans Bolt, Base44 ni Supabase

Cette version stocke l'historique des combats dans le navigateur (localStorage).

## Option la plus simple

Le projet doit être lancé avec Node.js + npm :

1. Installer Node.js LTS si nécessaire.
2. Décompresser ce ZIP.
3. Ouvrir un terminal dans le dossier du projet.
4. Exécuter `npm install` puis `npm run dev`.
5. Ouvrir l'adresse affichée par Vite (généralement http://localhost:5173).

Aucune clé Bolt, Base44 ou Supabase n'est nécessaire.

## Important

L'historique qui était dans l'ancienne base Supabase n'est pas automatiquement récupéré : la V2 commence avec l'historique local du navigateur. Les nouveaux combats sont conservés automatiquement.
