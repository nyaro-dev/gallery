-- ============================================================
-- Galerie photo — initialisation Supabase
-- À exécuter une fois dans le SQL Editor du dashboard :
-- https://supabase.com/dashboard/project/zquwcnrplxtumsauwbea/sql
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  year text not null default '',
  title text not null default '',
  description text not null default '',
  image_url text not null,
  storage_path text,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
-- Projet personnel sans authentification : accès ouvert.
-- (À restreindre le jour où une auth sera ajoutée.)

alter table public.chapters enable row level security;
alter table public.photos enable row level security;

drop policy if exists "chapters_all" on public.chapters;
create policy "chapters_all" on public.chapters
  for all using (true) with check (true);

drop policy if exists "photos_all" on public.photos;
create policy "photos_all" on public.photos
  for all using (true) with check (true);

-- ---------- Storage (bucket "gallery") ----------

update storage.buckets set public = true where id = 'gallery';

drop policy if exists "gallery_read" on storage.objects;
create policy "gallery_read" on storage.objects
  for select using (bucket_id = 'gallery');

drop policy if exists "gallery_insert" on storage.objects;
create policy "gallery_insert" on storage.objects
  for insert with check (bucket_id = 'gallery');

drop policy if exists "gallery_update" on storage.objects;
create policy "gallery_update" on storage.objects
  for update using (bucket_id = 'gallery') with check (bucket_id = 'gallery');

drop policy if exists "gallery_delete" on storage.objects;
create policy "gallery_delete" on storage.objects
  for delete using (bucket_id = 'gallery');

-- ---------- Chapitres de départ ----------

insert into public.chapters (name, position)
select v.name, v.position
from (values
  ('LES ANNÉES 60', 0),
  ('LES ANNÉES 70', 1),
  ('LES ANNÉES 80', 2),
  ('AUJOURD''HUI', 3)
) as v(name, position)
where not exists (select 1 from public.chapters);
