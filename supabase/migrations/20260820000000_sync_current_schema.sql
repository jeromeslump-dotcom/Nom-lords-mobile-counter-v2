-- ============================================================
-- Lords Mobile Counter V2
-- Synchronisation du schéma Supabase actuel
-- Date : 2026-08-20
--
-- Cette migration fait évoluer le schéma initial vers le
-- schéma actuellement utilisé par l'application.
--
-- IMPORTANT :
-- - aucune donnée existante n'est supprimée
-- - combats.user_id reste nullable
-- - combats.created_by reste nullable
-- - RLS est activé sur les trois tables
-- ============================================================


-- ============================================================
-- 1. PROFILES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  display_name text,

  role text not null default 'user',

  active boolean not null default true,

  created_at timestamptz not null default now(),

  constraint profiles_role_check
    check (role in ('user', 'contributor', 'admin'))
);


-- ============================================================
-- 2. HERO SETTINGS
-- ============================================================

create table if not exists public.hero_settings (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  excluded_hero_ids text[] not null default '{}',

  updated_at timestamptz not null default now()
);


-- ============================================================
-- 3. EVOLUTION DE COMBATS
-- ============================================================

alter table public.combats
  add column if not exists user_id uuid;

alter table public.combats
  add column if not exists created_by uuid;

alter table public.combats
  add column if not exists status text not null default 'active';


-- ============================================================
-- 4. FOREIGN KEYS DE COMBATS
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from pg_constraint
    where conname = 'combats_user_id_fkey'
  ) then

    alter table public.combats
      add constraint combats_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete set null;

  end if;


  if not exists (
    select 1
    from pg_constraint
    where conname = 'combats_created_by_fkey'
  ) then

    alter table public.combats
      add constraint combats_created_by_fkey
      foreign key (created_by)
      references auth.users(id)
      on delete set null;

  end if;

end
$$;


-- ============================================================
-- 5. CONTRAINTE STATUS
-- ============================================================

do $$
begin

  if not exists (
    select 1
    from pg_constraint
    where conname = 'combats_status_check'
  ) then

    alter table public.combats
      add constraint combats_status_check
      check (status in ('active', 'removed'));

  end if;

end
$$;


-- ============================================================
-- 6. FONCTION : IS ADMIN
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and active = true
  );
$function$;


-- ============================================================
-- 7. FONCTION : IS ACTIVE USER
-- ============================================================

create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active = true
      and role in ('user', 'contributor', 'admin')
  );
$function$;


-- ============================================================
-- 8. FONCTION : CAN CONTRIBUTE
-- ============================================================

create or replace function public.can_contribute()
returns boolean
language sql
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and active = true
      and role in ('contributor', 'admin')
  );
$function$;


-- ============================================================
-- 9. RLS
-- ============================================================

alter table public.combats enable row level security;

alter table public.profiles enable row level security;

alter table public.hero_settings enable row level security;


-- ============================================================
-- 10. NETTOYAGE DES ANCIENNES POLICIES
-- ============================================================

drop policy if exists "Admins can delete combats"
  on public.combats;

drop policy if exists "Admins can update combats"
  on public.combats;

drop policy if exists "Authenticated users can view active combats"
  on public.combats;

drop policy if exists "Contributors can insert combats"
  on public.combats;


drop policy if exists "Users can delete their hero settings"
  on public.hero_settings;

drop policy if exists "Users can insert their hero settings"
  on public.hero_settings;

drop policy if exists "Users can update their hero settings"
  on public.hero_settings;

drop policy if exists "Users can view their hero settings"
  on public.hero_settings;


drop policy if exists "Admins can view all profiles"
  on public.profiles;

drop policy if exists "Users can view their own profile"
  on public.profiles;


-- ============================================================
-- 11. POLICIES : COMBATS
-- ============================================================

create policy "Authenticated users can view active combats"
on public.combats
for select
to authenticated
using (
  is_active_user()
  and status = 'active'
);


create policy "Contributors can insert combats"
on public.combats
for insert
to authenticated
with check (
  can_contribute()
  and created_by = auth.uid()
  and status = 'active'
);


create policy "Admins can update combats"
on public.combats
for update
to authenticated
using (
  is_admin()
)
with check (
  is_admin()
);


create policy "Admins can delete combats"
on public.combats
for delete
to authenticated
using (
  is_admin()
);


-- ============================================================
-- 12. POLICIES : HERO SETTINGS
-- ============================================================

create policy "Users can view their hero settings"
on public.hero_settings
for select
to authenticated
using (
  auth.uid() = user_id
);


create policy "Users can insert their hero settings"
on public.hero_settings
for insert
to authenticated
with check (
  auth.uid() = user_id
);


create policy "Users can update their hero settings"
on public.hero_settings
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


create policy "Users can delete their hero settings"
on public.hero_settings
for delete
to authenticated
using (
  auth.uid() = user_id
);


-- ============================================================
-- 13. POLICIES : PROFILES
-- ============================================================

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
);


create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (
  is_admin()
);


-- ============================================================
-- FIN
-- ============================================================