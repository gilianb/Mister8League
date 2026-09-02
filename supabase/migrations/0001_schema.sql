-- ============================================================
-- Mister 8 Tournament League — schéma initial
-- Multi-jeu, multi-saison. Matching joueurs par ID membre Bandai.
-- ============================================================

-- ---------- Référentiels ----------

create table games (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- 'one-piece', 'riftbound'
  name text not null
);

create table seasons (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id),
  slug text unique not null,          -- 'saison-1'
  name text not null,
  starts_on date not null,
  ends_on date,
  qualified_count int not null default 16,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  created_at timestamptz not null default now()
);

-- Barème configurable par saison : tranches de placement -> points.
-- Une tranche « participation » = placement_min 1, placement_max null.
-- La règle la plus spécifique (tranche la plus étroite) gagne.
create table point_scale_rules (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  label text not null,                -- '1er', 'Top 8', 'Participation'
  placement_min int not null check (placement_min >= 1),
  placement_max int check (placement_max is null or placement_max >= placement_min),
  points int not null check (points >= 0)
);

create table leaders (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id),
  name text not null,                 -- 'Monkey.D.Luffy'
  code text,                          -- 'OP01-001'
  colors text[] not null default '{}',-- pour le métagame (rouge, vert…)
  image_url text,                     -- visuel de la carte leader
  unique (game_id, code)              -- plusieurs leaders partagent un même nom (Luffy…)
);

-- ---------- Comptes & identités joueurs ----------

-- Compte applicatif (1:1 avec auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pseudo text unique,
  avatar_url text,
  role text not null default 'player' check (role in ('player', 'admin')),
  bandai_member_id text,              -- saisi par le joueur -> rattachement auto
  games text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Identité « ligue » : peut exister avant tout compte (import CSV).
-- bandai_member_id est la clé de matching principale (export Bandai TCG+).
create table players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  bandai_member_id text unique,
  email_normalized text,
  profile_id uuid references profiles(id) on delete set null,
  merged_into uuid references players(id),
  created_at timestamptz not null default now()
);

create index players_profile_idx on players(profile_id);

-- ---------- Événements & résultats ----------

create table events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id),
  slug text unique not null,          -- 'op16-juillet-2026'
  name text not null,
  starts_at timestamptz not null,
  location text not null default 'Courbevoie',
  format_label text,                  -- 'OP16', 'OP14-EB04', 'Constructed'
  capacity int,
  price_cents int,
  ticket_url text,                    -- billetterie mister-8.com
  rounds int,                         -- nb de rondes suisses (déduction V/D)
  status text not null default 'draft' check (status in ('draft', 'published', 'completed')),
  created_at timestamptz not null default now()
);

create table results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id),
  placement int not null check (placement >= 1),
  match_points int,                   -- « Points gagnants » Bandai (3/victoire)
  wins int, losses int, draws int,
  omw_pct numeric(5, 2),              -- tiebreakers export Bandai
  oomw_pct numeric(5, 2),
  leader_id uuid references leaders(id),
  deck_name text,
  league_points int not null default 0,
  unique (event_id, player_id)
);

create index results_player_idx on results(player_id);

create table decklists (
  id uuid primary key default gen_random_uuid(),
  result_id uuid unique not null references results(id) on delete cascade,
  content jsonb not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Attribution des points (zéro double saisie) ----------

create or replace function compute_league_points(p_season uuid, p_placement int)
returns int language sql stable as $$
  select coalesce((
    select points from point_scale_rules
    where season_id = p_season
      and p_placement >= placement_min
      and (placement_max is null or p_placement <= placement_max)
    order by coalesce(placement_max, 2147483647) - placement_min
    limit 1
  ), 0);
$$;

-- Recalcule tous les points d'un événement (à l'import, ou si le barème change)
create or replace function apply_league_points(p_event uuid)
returns void language sql as $$
  update results r
  set league_points = compute_league_points(e.season_id, r.placement)
  from events e
  where r.event_id = p_event and e.id = p_event;
$$;

create or replace function results_set_points()
returns trigger language plpgsql as $$
begin
  select compute_league_points(e.season_id, new.placement)
  into new.league_points
  from events e where e.id = new.event_id;
  return new;
end;
$$;

create trigger results_points before insert or update of placement on results
for each row execute function results_set_points();

-- Rattachement automatique : quand un profil renseigne son ID Bandai,
-- l'identité ligue correspondante lui est liée.
create or replace function link_player_to_profile()
returns trigger language plpgsql security definer as $$
begin
  if new.bandai_member_id is not null then
    update players set profile_id = new.id
    where bandai_member_id = new.bandai_member_id and profile_id is null;
  end if;
  return new;
end;
$$;

create trigger profiles_link_player after insert or update of bandai_member_id on profiles
for each row execute function link_player_to_profile();

-- ---------- Vues (classements & stats calculés) ----------

create view season_standings as
select
  e.season_id,
  p.id as player_id,
  p.display_name,
  p.profile_id,
  sum(r.league_points)::int as total_points,
  count(r.id)::int as events_played,
  min(r.placement) as best_placement,
  coalesce(sum(r.wins), 0)::int as wins,
  coalesce(sum(r.losses), 0)::int as losses,
  coalesce(sum(r.draws), 0)::int as draws,
  rank() over (
    partition by e.season_id
    order by sum(r.league_points) desc, min(r.placement) asc
  )::int as rank
from results r
join events e on e.id = r.event_id and e.status = 'completed'
join players p on p.id = r.player_id and p.merged_into is null
group by e.season_id, p.id;

create view event_metagame as
select
  r.event_id,
  l.id as leader_id,
  l.name as leader_name,
  l.colors,
  count(*)::int as players_count,
  min(r.placement) as best_placement
from results r
join leaders l on l.id = r.leader_id
group by r.event_id, l.id;

create view player_deck_stats as
select
  r.player_id,
  e.season_id,
  l.id as leader_id,
  l.name as leader_name,
  count(*)::int as events_played,
  coalesce(sum(r.wins), 0)::int as wins,
  coalesce(sum(r.losses), 0)::int as losses,
  min(r.placement) as best_placement
from results r
join events e on e.id = r.event_id
join leaders l on l.id = r.leader_id
group by r.player_id, e.season_id, l.id;

-- ---------- Sécurité (RLS) ----------

create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

alter table games enable row level security;
alter table seasons enable row level security;
alter table point_scale_rules enable row level security;
alter table leaders enable row level security;
alter table profiles enable row level security;
alter table players enable row level security;
alter table events enable row level security;
alter table results enable row level security;
alter table decklists enable row level security;

-- Lecture publique du contenu publié
create policy "public read" on games for select using (true);
create policy "public read" on seasons for select using (status <> 'draft' or is_admin());
create policy "public read" on point_scale_rules for select using (true);
create policy "public read" on leaders for select using (true);
create policy "public read" on players for select using (true);
create policy "public read" on events for select using (status <> 'draft' or is_admin());
create policy "public read completed" on results for select using (
  is_admin() or exists (select 1 from events e where e.id = event_id and e.status = 'completed')
);
create policy "public read published" on decklists for select using (published or is_admin());

-- Profils : chacun le sien, admins tout
create policy "own profile read" on profiles for select using (id = auth.uid() or is_admin());
create policy "own profile insert" on profiles for insert with check (id = auth.uid());
-- le check empêche l'auto-promotion en admin
create policy "own profile update" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and (role = 'player' or is_admin()));

-- Écriture : admins uniquement
create policy "admin write" on games for all using (is_admin()) with check (is_admin());
create policy "admin write" on seasons for all using (is_admin()) with check (is_admin());
create policy "admin write" on point_scale_rules for all using (is_admin()) with check (is_admin());
create policy "admin write" on leaders for all using (is_admin()) with check (is_admin());
create policy "admin write" on players for all using (is_admin()) with check (is_admin());
create policy "admin write" on events for all using (is_admin()) with check (is_admin());
create policy "admin write" on results for all using (is_admin()) with check (is_admin());
create policy "admin write" on decklists for all using (is_admin()) with check (is_admin());
