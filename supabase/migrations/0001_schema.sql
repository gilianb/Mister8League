-- ============================================================
-- Mister 8 Tournament League — schéma complet (nouvelle base)
--
-- Idempotent : peut être rejoué sans casser une base existante.
-- À exécuter dans l'éditeur SQL du projet Supabase, puis 0002_seed.sql
-- et 0003_leaders.sql.
--
-- Miroir TypeScript : src/lib/db/types.ts
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Utilitaires
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Référentiels
-- ------------------------------------------------------------

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,            -- 'one-piece'
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id),
  slug text unique not null,            -- '2026-2027'
  name text not null,                   -- 'Saison 2026/2027'
  starts_on date not null,
  ends_on date,
  qualified_count int not null default 16 check (qualified_count >= 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Une seule saison active par jeu.
create unique index if not exists seasons_one_active_per_game
  on public.seasons (game_id) where status = 'active';
drop trigger if exists seasons_updated_at on public.seasons;
create trigger seasons_updated_at before update on public.seasons
  for each row execute function public.set_updated_at();

-- Barème par saison : la règle la plus étroite (tranche la plus courte) gagne.
create table if not exists public.point_scale_rules (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  label text not null,                  -- '1er', 'Top 8'…
  placement_min int not null check (placement_min >= 1),
  placement_max int check (placement_max is null or placement_max >= placement_min),
  points int not null check (points >= 0)
);
create index if not exists point_scale_rules_season_idx on public.point_scale_rules (season_id);

create table if not exists public.leaders (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id),
  code text,                            -- 'OP01-001'
  name text not null,
  colors text[] not null default '{}',
  image_url text,
  unique (game_id, code)
);

-- ------------------------------------------------------------
-- Comptes (profiles) et identités ligue (players)
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text,
  full_name text,
  bandai_member_id text,                -- chiffres uniquement, zéros de tête conservés
  avatar_url text,
  bio text,
  phone text,
  role text not null default 'player' check (role in ('player', 'admin')),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_pseudo_unique
  on public.profiles (lower(pseudo)) where pseudo is not null;
create unique index if not exists profiles_bandai_unique
  on public.profiles (bandai_member_id) where bandai_member_id is not null;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Identité « ligue » : peut exister sans compte (joueur importé d'un CSV).
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  bandai_member_id text,
  profile_id uuid references public.profiles(id) on delete set null,
  merged_into uuid references public.players(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists players_bandai_unique
  on public.players (bandai_member_id) where bandai_member_id is not null;
create unique index if not exists players_profile_unique
  on public.players (profile_id) where profile_id is not null;
drop trigger if exists players_updated_at on public.players;
create trigger players_updated_at before update on public.players
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ------------------------------------------------------------
-- Decks
-- ------------------------------------------------------------

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  leader_id uuid references public.leaders(id),
  decklist_text text,
  notes text,
  is_public boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists decks_profile_idx on public.decks (profile_id);
drop trigger if exists decks_updated_at on public.decks;
create trigger decks_updated_at before update on public.decks
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Tournois et inscriptions
-- ------------------------------------------------------------

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id),
  season_id uuid references public.seasons(id),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  rules_text text,
  schedule_text text,
  prizes_text text,
  format_label text,                    -- 'OP16', 'OP14-EB04'…
  venue_name text,
  venue_address text,
  city text not null default 'Courbevoie',
  google_maps_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  registration_open_at timestamptz,
  registration_close_at timestamptz,
  capacity int not null default 64 check (capacity >= 0),   -- 0 = illimité
  price_cents int not null default 0 check (price_cents >= 0),
  fee_bps int not null default 0 check (fee_bps >= 0),      -- frais de paiement, 500 = 5 %
  currency text not null default 'EUR',
  cover_image_url text,
  is_featured boolean not null default false,
  rounds int,
  counts_for_league boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled', 'completed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_season_idx on public.events (season_id);
drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,  -- null = inscrit « cash » sans compte
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'checked_in', 'cancelled', 'refunded')),
  expires_at timestamptz,               -- fin de la réservation de place
  participant_name text not null,
  participant_email text not null,
  participant_phone text,
  notes text,
  deck_id uuid references public.decks(id) on delete set null,
  leader_id uuid references public.leaders(id),
  payment_provider text check (payment_provider is null or payment_provider in ('mollie', 'cash', 'free')),
  mollie_payment_id text,
  mollie_payment_status text,
  amount_cents int,
  currency text,
  billing_data jsonb,
  mollie_sales_invoice_id text,
  mollie_sales_invoice_status text,
  mollie_sales_invoice_number text,
  mollie_sales_invoice_pdf_url text,
  mollie_sales_invoice_created_at timestamptz,
  ticket_pdf_path text,
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles(id),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists registrations_event_idx on public.registrations (event_id);
create index if not exists registrations_profile_idx on public.registrations (profile_id);
create unique index if not exists registrations_mollie_payment_unique
  on public.registrations (mollie_payment_id) where mollie_payment_id is not null;
-- Une seule inscription « vivante » par joueur et par tournoi.
create unique index if not exists registrations_one_active_per_profile
  on public.registrations (event_id, profile_id)
  where profile_id is not null and status in ('pending_payment', 'paid', 'checked_in');
drop trigger if exists registrations_updated_at on public.registrations;
create trigger registrations_updated_at before update on public.registrations
  for each row execute function public.set_updated_at();

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  provider text not null,
  event_type text not null,
  provider_ref text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payment_events_registration_idx on public.payment_events (registration_id);

create table if not exists public.ticket_tokens (
  registration_id uuid primary key references public.registrations(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references public.registrations(id) on delete cascade,
  kind text not null,
  recipient_email text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  provider text,
  provider_ref text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists email_events_registration_idx on public.email_events (registration_id);

create table if not exists public.admin_events (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  registration_id uuid references public.registrations(id) on delete set null,
  action text not null,
  from_status text,
  to_status text,
  note text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Résultats
-- ------------------------------------------------------------

create table if not exists public.result_imports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  file_name text,
  raw_csv text,
  rounds int,
  status text not null default 'pending' check (status in ('pending', 'applied', 'discarded')),
  created_by uuid references public.profiles(id) on delete set null,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists result_imports_one_pending
  on public.result_imports (event_id) where status = 'pending';
drop trigger if exists result_imports_updated_at on public.result_imports;
create trigger result_imports_updated_at before update on public.result_imports
  for each row execute function public.set_updated_at();

create table if not exists public.result_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.result_imports(id) on delete cascade,
  row_index int not null,
  placement int not null,
  bandai_member_id text,
  player_name text not null,
  match_points int not null default 0,
  wins int not null default 0,
  draws int not null default 0,
  losses int not null default 0,
  omw_pct numeric(5, 2),
  oomw_pct numeric(5, 2),
  memo text,
  deck_urls text,
  resolution text not null default 'unresolved' check (resolution in (
    'auto_player', 'auto_registration', 'registration', 'player', 'new_player', 'skip', 'unresolved')),
  player_id uuid references public.players(id) on delete set null,
  registration_id uuid references public.registrations(id) on delete set null,
  leader_id uuid references public.leaders(id),
  deck_id uuid references public.decks(id) on delete set null,
  unique (import_id, row_index)
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.players(id),
  placement int not null check (placement >= 1),
  match_points int,
  wins int,
  losses int,
  draws int,
  omw_pct numeric(5, 2),
  oomw_pct numeric(5, 2),
  leader_id uuid references public.leaders(id),
  deck_id uuid references public.decks(id) on delete set null,
  league_points int not null default 0,
  import_id uuid references public.result_imports(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, player_id)
);
create index if not exists results_player_idx on public.results (player_id);

-- ------------------------------------------------------------
-- Fonctions métier
-- ------------------------------------------------------------

-- Profil créé automatiquement à l'inscription (métadonnées du signUp).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pseudo text := nullif(trim(coalesce(new.raw_user_meta_data->>'pseudo', '')), '');
  v_full_name text := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  v_bandai text := nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'bandai_member_id', ''), '\D', '', 'g'), '');
begin
  begin
    insert into public.profiles (id, pseudo, full_name, bandai_member_id)
    values (new.id, v_pseudo, v_full_name, v_bandai);
  exception when unique_violation then
    -- Pseudo ou numéro Bandai pris entre-temps : profil minimal, à compléter.
    insert into public.profiles (id, full_name) values (new.id, v_full_name)
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Normalise le numéro Bandai (chiffres uniquement) et protège le rôle.
create or replace function public.profiles_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.bandai_member_id := nullif(regexp_replace(coalesce(new.bandai_member_id, ''), '\D', '', 'g'), '');
  new.pseudo := nullif(trim(coalesce(new.pseudo, '')), '');
  if tg_op = 'UPDATE' and new.role is distinct from old.role
     and auth.role() is distinct from 'service_role' and not public.is_admin() then
    raise exception 'role_change_forbidden';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_before_write on public.profiles;
create trigger profiles_before_write before insert or update on public.profiles
  for each row execute function public.profiles_before_write();

-- Fusionne deux identités ligue (la source disparaît dans la cible).
create or replace function public.merge_players(p_source uuid, p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid;
  v_bandai text;
begin
  if p_source is null or p_target is null or p_source = p_target then return; end if;
  select profile_id, bandai_member_id into v_profile, v_bandai from public.players where id = p_source;

  -- Doublons sur un même tournoi : on garde le résultat de la cible.
  delete from public.results r
   where r.player_id = p_source
     and exists (select 1 from public.results t where t.event_id = r.event_id and t.player_id = p_target);
  update public.results set player_id = p_target where player_id = p_source;
  update public.result_import_rows set player_id = p_target where player_id = p_source;

  update public.players set merged_into = p_target, bandai_member_id = null, profile_id = null where id = p_source;
  update public.players
     set profile_id = coalesce(profile_id, v_profile),
         bandai_member_id = coalesce(bandai_member_id, v_bandai)
   where id = p_target;
end;
$$;

-- Rattachement profil ↔ joueur dès que le numéro Bandai est renseigné.
create or replace function public.link_player_to_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_existing public.players%rowtype;    -- joueur portant ce numéro Bandai
  v_mine public.players%rowtype;        -- joueur déjà rattaché au profil
  v_name text := coalesce(new.pseudo, new.full_name, 'Joueur');
begin
  select * into v_mine from public.players where profile_id = new.id and merged_into is null limit 1;

  if new.bandai_member_id is null then
    if v_mine.id is not null then
      update public.players set display_name = v_name where id = v_mine.id;
    end if;
    return new;
  end if;

  select * into v_existing from public.players
   where bandai_member_id = new.bandai_member_id and merged_into is null limit 1;

  if v_existing.id is not null then
    if v_existing.profile_id is null then
      -- Joueur importé sans compte : on le rattache (et on fusionne l'éventuelle ancienne identité).
      if v_mine.id is not null and v_mine.id <> v_existing.id then
        perform public.merge_players(v_mine.id, v_existing.id);
      end if;
      update public.players set profile_id = new.id, display_name = v_name where id = v_existing.id;
    elsif v_existing.profile_id = new.id then
      update public.players set display_name = v_name where id = v_existing.id;
    end if;
    -- sinon : numéro porté par un autre compte, l'index unique de profiles l'a déjà empêché.
  elsif v_mine.id is not null then
    update public.players set bandai_member_id = new.bandai_member_id, display_name = v_name where id = v_mine.id;
  else
    insert into public.players (display_name, bandai_member_id, profile_id)
    values (v_name, new.bandai_member_id, new.id);
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_link_player on public.profiles;
create trigger profiles_link_player after insert or update of bandai_member_id, pseudo, full_name on public.profiles
  for each row execute function public.link_player_to_profile();

-- Points de ligue : règle la plus étroite qui contient le placement.
create or replace function public.compute_league_points(p_season uuid, p_placement int)
returns int language sql stable set search_path = public as $$
  select coalesce((
    select points from public.point_scale_rules
    where season_id = p_season
      and p_placement >= placement_min
      and (placement_max is null or p_placement <= placement_max)
    order by coalesce(placement_max, 2147483647) - placement_min
    limit 1
  ), 0);
$$;

-- Recalcule les points d'un événement (import, ou changement de barème).
create or replace function public.apply_league_points(p_event uuid)
returns void language sql set search_path = public as $$
  update public.results r
  set league_points = case
    when e.counts_for_league and e.season_id is not null then public.compute_league_points(e.season_id, r.placement)
    else 0 end
  from public.events e
  where r.event_id = p_event and e.id = p_event;
$$;

create or replace function public.apply_league_points_for_season(p_season uuid)
returns void language sql set search_path = public as $$
  update public.results r
  set league_points = case
    when e.counts_for_league then public.compute_league_points(e.season_id, r.placement)
    else 0 end
  from public.events e
  where e.id = r.event_id and e.season_id = p_season;
$$;

create or replace function public.results_set_points()
returns trigger language plpgsql set search_path = public as $$
declare
  v_season uuid;
  v_counts boolean;
begin
  select season_id, counts_for_league into v_season, v_counts from public.events where id = new.event_id;
  if v_season is null or not v_counts then
    new.league_points := 0;
  else
    new.league_points := public.compute_league_points(v_season, new.placement);
  end if;
  return new;
end;
$$;
drop trigger if exists results_points on public.results;
create trigger results_points before insert or update of placement, event_id on public.results
  for each row execute function public.results_set_points();

-- Passe en « cancelled » les réservations dont le délai de paiement est dépassé.
create or replace function public.expire_pending_registrations(p_event_id uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  with upd as (
    update public.registrations
       set status = 'cancelled'
     where status = 'pending_payment'
       and expires_at is not null and expires_at < now()
       and (p_event_id is null or event_id = p_event_id)
    returning 1
  )
  select count(*) into v_count from upd;
  return v_count;
end;
$$;

-- Réservation de place (appelée par le joueur connecté). Erreurs codées dans le message.
create or replace function public.reserve_seat(
  p_event_id uuid,
  p_deck_id uuid default null,
  p_leader_id uuid default null,
  p_phone text default null,
  p_notes text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_event public.events%rowtype;
  v_email text;
  v_leader uuid := p_leader_id;
  v_active int;
  v_id uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.id is null or v_profile.pseudo is null or v_profile.full_name is null or v_profile.bandai_member_id is null then
    raise exception 'profile_incomplete';
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if v_event.id is null or v_event.status <> 'published' then raise exception 'registration_closed'; end if;
  if v_event.starts_at <= now() then raise exception 'registration_closed'; end if;
  if v_event.registration_open_at is not null and v_event.registration_open_at > now() then
    raise exception 'registration_not_open_yet';
  end if;
  if v_event.registration_close_at is not null and v_event.registration_close_at < now() then
    raise exception 'registration_closed';
  end if;

  perform public.expire_pending_registrations(p_event_id);

  if exists (
    select 1 from public.registrations
    where event_id = p_event_id and profile_id = v_uid
      and status in ('pending_payment', 'paid', 'checked_in')
  ) then
    raise exception 'already_registered';
  end if;

  select count(*) into v_active from public.registrations
   where event_id = p_event_id and status in ('pending_payment', 'paid', 'checked_in');
  if v_event.capacity > 0 and v_active >= v_event.capacity then raise exception 'event_full'; end if;

  if p_deck_id is not null then
    if not exists (select 1 from public.decks where id = p_deck_id and profile_id = v_uid) then
      raise exception 'deck_not_found';
    end if;
    if v_leader is null then
      select leader_id into v_leader from public.decks where id = p_deck_id;
    end if;
  end if;

  select email into v_email from auth.users where id = v_uid;

  insert into public.registrations (
    event_id, profile_id, status, expires_at,
    participant_name, participant_email, participant_phone, notes,
    deck_id, leader_id, currency
  ) values (
    p_event_id, v_uid, 'pending_payment', now() + interval '15 minutes',
    v_profile.full_name, coalesce(v_email, ''), nullif(trim(coalesce(p_phone, '')), ''), nullif(trim(coalesce(p_notes, '')), ''),
    p_deck_id, v_leader, v_event.currency
  ) returning id into v_id;

  return v_id;
end;
$$;
revoke all on function public.reserve_seat(uuid, uuid, uuid, text, text) from public;
grant execute on function public.reserve_seat(uuid, uuid, uuid, text, text) to authenticated, service_role;

-- ------------------------------------------------------------
-- Vues (exécutées avec les droits du propriétaire : elles n'exposent
-- que des colonnes publiques et filtrent sur les événements terminés)
-- ------------------------------------------------------------

drop view if exists public.public_profiles cascade;
create view public.public_profiles as
  select id, pseudo, avatar_url, bio, is_public, created_at
  from public.profiles;

drop view if exists public.event_seat_counts cascade;
create view public.event_seat_counts as
  select
    e.id as event_id,
    count(r.id) filter (
      where r.status in ('paid', 'checked_in')
         or (r.status = 'pending_payment' and r.expires_at > now())
    )::int as active_count,
    count(r.id) filter (where r.status in ('paid', 'checked_in'))::int as paid_count,
    count(r.id) filter (where r.status = 'checked_in')::int as checked_in_count
  from public.events e
  left join public.registrations r on r.event_id = e.id
  group by e.id;

drop view if exists public.season_standings cascade;
create view public.season_standings as
  select
    e.season_id,
    p.id as player_id,
    p.profile_id,
    coalesce(pr.pseudo, p.display_name) as display_name,
    pr.pseudo,
    pr.avatar_url,
    coalesce(pr.is_public, false) as is_public,
    sum(r.league_points)::int as total_points,
    count(r.id)::int as events_played,
    min(r.placement) as best_placement,
    coalesce(sum(r.wins), 0)::int as wins,
    coalesce(sum(r.losses), 0)::int as losses,
    coalesce(sum(r.draws), 0)::int as draws,
    rank() over (
      partition by e.season_id
      order by sum(r.league_points) desc, min(r.placement) asc, count(r.id) desc
    )::int as rank
  from public.results r
  join public.events e on e.id = r.event_id and e.status = 'completed' and e.counts_for_league
  join public.players p on p.id = r.player_id and p.merged_into is null
  left join public.profiles pr on pr.id = p.profile_id
  where e.season_id is not null
  group by e.season_id, p.id, pr.pseudo, pr.avatar_url, pr.is_public;

drop view if exists public.event_results_public cascade;
create view public.event_results_public as
  select
    r.event_id,
    r.id as result_id,
    r.player_id,
    p.profile_id,
    coalesce(pr.pseudo, p.display_name) as display_name,
    pr.pseudo,
    pr.avatar_url,
    coalesce(pr.is_public, false) as is_public,
    r.placement, r.match_points, r.wins, r.losses, r.draws, r.omw_pct, r.oomw_pct, r.league_points,
    r.leader_id, l.name as leader_name, l.code as leader_code, l.image_url as leader_image_url
  from public.results r
  join public.events e on e.id = r.event_id and e.status = 'completed'
  join public.players p on p.id = r.player_id
  left join public.profiles pr on pr.id = p.profile_id
  left join public.leaders l on l.id = r.leader_id;

drop view if exists public.event_metagame cascade;
create view public.event_metagame as
  select
    r.event_id,
    l.id as leader_id,
    l.name as leader_name,
    l.code as leader_code,
    l.colors,
    l.image_url,
    count(*)::int as players_count,
    min(r.placement) as best_placement
  from public.results r
  join public.events e on e.id = r.event_id and e.status = 'completed'
  join public.leaders l on l.id = r.leader_id
  group by r.event_id, l.id;

drop view if exists public.player_history cascade;
create view public.player_history as
  select
    r.player_id,
    r.id as result_id,
    e.id as event_id,
    e.slug as event_slug,
    e.title as event_title,
    e.starts_at,
    e.season_id,
    r.placement, r.wins, r.losses, r.draws, r.league_points,
    r.leader_id, l.name as leader_name, l.code as leader_code, l.image_url as leader_image_url
  from public.results r
  join public.events e on e.id = r.event_id and e.status = 'completed'
  left join public.leaders l on l.id = r.leader_id;

drop view if exists public.player_deck_stats cascade;
create view public.player_deck_stats as
  select
    r.player_id,
    e.season_id,
    l.id as leader_id,
    l.name as leader_name,
    l.code as leader_code,
    l.image_url as leader_image_url,
    count(*)::int as events_played,
    coalesce(sum(r.wins), 0)::int as wins,
    coalesce(sum(r.losses), 0)::int as losses,
    coalesce(sum(r.draws), 0)::int as draws,
    min(r.placement) as best_placement,
    sum(r.league_points)::int as total_points
  from public.results r
  join public.events e on e.id = r.event_id and e.status = 'completed'
  join public.leaders l on l.id = r.leader_id
  group by r.player_id, e.season_id, l.id;

grant select on public.public_profiles, public.event_seat_counts, public.season_standings,
  public.event_results_public, public.event_metagame, public.player_history, public.player_deck_stats
  to anon, authenticated;

-- ------------------------------------------------------------
-- Sécurité (RLS)
-- ------------------------------------------------------------

alter table public.games enable row level security;
alter table public.seasons enable row level security;
alter table public.point_scale_rules enable row level security;
alter table public.leaders enable row level security;
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.decks enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.payment_events enable row level security;
alter table public.ticket_tokens enable row level security;
alter table public.email_events enable row level security;
alter table public.admin_events enable row level security;
alter table public.result_imports enable row level security;
alter table public.result_import_rows enable row level security;
alter table public.results enable row level security;

-- Lecture publique
drop policy if exists "public read" on public.games;
create policy "public read" on public.games for select using (true);
drop policy if exists "public read" on public.seasons;
create policy "public read" on public.seasons for select using (status <> 'draft' or public.is_admin());
drop policy if exists "public read" on public.point_scale_rules;
create policy "public read" on public.point_scale_rules for select using (true);
drop policy if exists "public read" on public.leaders;
create policy "public read" on public.leaders for select using (true);
drop policy if exists "public read" on public.players;
create policy "public read" on public.players for select using (true);
drop policy if exists "public read" on public.events;
create policy "public read" on public.events for select using (status <> 'draft' or public.is_admin());
drop policy if exists "public read completed" on public.results;
create policy "public read completed" on public.results for select using (
  public.is_admin() or exists (select 1 from public.events e where e.id = event_id and e.status = 'completed')
);

-- Profils : chacun le sien (le rôle est protégé par trigger), admins tout
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Decks : publics en lecture, propriétaire en écriture
drop policy if exists "decks read" on public.decks;
create policy "decks read" on public.decks for select using (is_public or profile_id = auth.uid() or public.is_admin());
drop policy if exists "decks insert own" on public.decks;
create policy "decks insert own" on public.decks for insert with check (profile_id = auth.uid());
drop policy if exists "decks update own" on public.decks;
create policy "decks update own" on public.decks for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "decks delete own" on public.decks;
create policy "decks delete own" on public.decks for delete using (profile_id = auth.uid());

-- Inscriptions : le joueur lit les siennes (écritures via reserve_seat et le serveur)
drop policy if exists "own registrations read" on public.registrations;
create policy "own registrations read" on public.registrations for select using (profile_id = auth.uid() or public.is_admin());

-- Écriture : admins uniquement (le service role contourne la RLS)
drop policy if exists "admin write" on public.games;
create policy "admin write" on public.games for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write" on public.seasons;
create policy "admin write" on public.seasons for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write" on public.point_scale_rules;
create policy "admin write" on public.point_scale_rules for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write" on public.leaders;
create policy "admin write" on public.leaders for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write" on public.players;
create policy "admin write" on public.players for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write" on public.events;
create policy "admin write" on public.events for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write" on public.registrations;
create policy "admin write" on public.registrations for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all" on public.payment_events;
create policy "admin all" on public.payment_events for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all" on public.ticket_tokens;
create policy "admin all" on public.ticket_tokens for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all" on public.email_events;
create policy "admin all" on public.email_events for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all" on public.admin_events;
create policy "admin all" on public.admin_events for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all" on public.result_imports;
create policy "admin all" on public.result_imports for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all" on public.result_import_rows;
create policy "admin all" on public.result_import_rows for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin write" on public.results;
create policy "admin write" on public.results for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- Storage
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('tournament-tickets', 'tournament-tickets', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

-- Avatars : lecture publique, écriture par le propriétaire dans son dossier <uid>/
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars own insert" on storage.objects;
create policy "avatars own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars own update" on storage.objects;
create policy "avatars own update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Visuels de tournoi : lecture publique, écriture admin
drop policy if exists "covers public read" on storage.objects;
create policy "covers public read" on storage.objects for select using (bucket_id = 'event-covers');
drop policy if exists "covers admin write" on storage.objects;
create policy "covers admin write" on storage.objects for all to authenticated
  using (bucket_id = 'event-covers' and public.is_admin())
  with check (bucket_id = 'event-covers' and public.is_admin());

-- Billets : aucun accès direct (URLs signées générées côté serveur).
