-- ============================================================
-- Migration : ordre manuel des photos
-- À exécuter une fois dans le SQL Editor (uniquement si ta base
-- a été créée avec une version de setup.sql antérieure à la
-- colonne position) :
-- https://supabase.com/dashboard/project/zquwcnrplxtumsauwbea/sql
-- ============================================================

alter table public.photos
  add column if not exists position int not null default 0;

-- Initialise l'ordre existant par chapitre (année puis date d'ajout)
with ordered as (
  select
    id,
    row_number() over (
      partition by chapter_id
      order by year, created_at
    ) - 1 as rn
  from public.photos
)
update public.photos p
set position = o.rn
from ordered o
where p.id = o.id;
