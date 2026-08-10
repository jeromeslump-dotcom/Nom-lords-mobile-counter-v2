/*
# Create combats table (single-tenant, no auth)

1. New Tables
- `combats`
  - `id` (uuid, primary key)
  - `enemy_heroes` (text[], not null) — ids of the 5 enemy heroes faced
  - `my_heroes` (text[], not null) — ids of the 5 heroes the user played
  - `won` (boolean, not null) — whether the user's team won
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `combats`.
- Allow anon + authenticated CRUD because the app is intentionally single-tenant (no sign-in).
3. Notes
- The app stores the user's own past combats and uses them to bias the
  counter-pick recommendation toward (enemy, my-team) combos that won.
*/

CREATE TABLE IF NOT EXISTS combats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enemy_heroes text[] NOT NULL,
  my_heroes text[] NOT NULL,
  won boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE combats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_combats" ON combats;
CREATE POLICY "anon_select_combats" ON combats FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_combats" ON combats;
CREATE POLICY "anon_insert_combats" ON combats FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_combats" ON combats;
CREATE POLICY "anon_update_combats" ON combats FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_combats" ON combats;
CREATE POLICY "anon_delete_combats" ON combats FOR DELETE
  TO anon, authenticated USING (true);
