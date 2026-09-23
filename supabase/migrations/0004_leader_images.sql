-- Visuels des leaders dans Supabase Storage + corrections de couleurs.
-- Idempotent : peut être relancé sans effet de bord.

-- ------------------------------------------------------------
-- Bucket des visuels (rempli par la synchronisation /admin/leaders)
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('leader-images', 'leader-images', true)
on conflict (id) do nothing;

drop policy if exists "leader images public read" on storage.objects;
create policy "leader images public read" on storage.objects for select using (bucket_id = 'leader-images');
drop policy if exists "leader images admin write" on storage.objects;
create policy "leader images admin write" on storage.objects for all to authenticated
  using (bucket_id = 'leader-images' and public.is_admin())
  with check (bucket_id = 'leader-images' and public.is_admin());

-- ------------------------------------------------------------
-- Couleurs mal lues lors de l'import initial (vérifiées sur optcgapi.com
-- et onepiece.limitlesstcg.com, qui concordent).
-- ------------------------------------------------------------

update public.leaders l
set colors = v.colors
from (values
  ('OP02-072', array['Violet', 'Noir']::text[]),
  ('OP04-020', array['Vert', 'Noir']::text[]),
  ('OP05-022', array['Vert', 'Bleu']::text[]),
  ('OP05-060', array['Violet']::text[]),
  ('OP06-001', array['Rouge', 'Violet']::text[]),
  ('OP13-003', array['Rouge', 'Violet']::text[]),
  ('OP13-004', array['Rouge', 'Noir']::text[])
) as v(code, colors), public.games g
where g.slug = 'one-piece' and l.game_id = g.id and l.code = v.code;
