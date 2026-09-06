-- Données de départ : jeu One Piece, saison 2026/2027 active et barème
-- officiel (modifiable dans l'admin). Idempotent.

insert into public.games (slug, name)
values ('one-piece', 'One Piece Card Game')
on conflict (slug) do nothing;

insert into public.seasons (game_id, slug, name, starts_on, ends_on, qualified_count, status)
select g.id, '2026-2027', 'Saison 2026/2027', '2026-09-01', '2027-08-31', 16, 'active'
from public.games g
where g.slug = 'one-piece'
on conflict (slug) do nothing;

insert into public.point_scale_rules (season_id, label, placement_min, placement_max, points)
select s.id, r.label, r.pmin, r.pmax, r.pts
from public.seasons s
cross join (values
  ('1er',        1,  1::int, 15),
  ('2ème',       2,  2,      10),
  ('Top 4',      3,  4,       8),
  ('Top 8',      5,  8,       6),
  ('Top 16',     9, 16,       4),
  ('Top 32',    17, 32,       2),
  ('Top 33-64', 33, 64,       1)
) as r(label, pmin, pmax, pts)
where s.slug = '2026-2027'
  and not exists (select 1 from public.point_scale_rules p where p.season_id = s.id);
