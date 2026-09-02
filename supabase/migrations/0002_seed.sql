-- Données de départ : jeux, saison 1 et barème par défaut (modifiable dans l'admin)

insert into games (slug, name) values
  ('one-piece', 'One Piece Card Game'),
  ('riftbound', 'Riftbound TCG');

insert into seasons (game_id, slug, name, starts_on, ends_on, qualified_count, status)
select id, 'saison-1', 'Saison 1 — 2026/2027', '2026-04-01', '2027-03-31', 16, 'active'
from games where slug = 'one-piece';

insert into point_scale_rules (season_id, label, placement_min, placement_max, points)
select s.id, r.label, r.pmin, r.pmax, r.pts
from seasons s
cross join (values
  ('1er',        1,  1::int, 15),
  ('2ème',       2,  2,      10),
  ('Top 4',      3,  4,       8),
  ('Top 8',      5,  8,       6),
  ('Top 16',     9, 16,       4),
  ('Top 32',    17, 32,       2),
  ('Top 33-64', 33, 64,       1)
) as r(label, pmin, pmax, pts)
where s.slug = 'saison-1';
