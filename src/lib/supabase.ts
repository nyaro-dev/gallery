import { createClient } from "@supabase/supabase-js";

export const BUCKET = "gallery";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export type DbChapter = {
  id: string;
  name: string;
  position: number;
  created_at: string;
};

export type DbPhoto = {
  id: string;
  chapter_id: string;
  year: string;
  title: string;
  description: string;
  image_url: string;
  storage_path: string | null;
  /** Absent tant que la migration photo-position n'a pas été exécutée. */
  position?: number | null;
  created_at: string;
};

/** Ordre d'affichage : position manuelle, puis année, puis date d'ajout. */
export function sortPhotos(list: DbPhoto[]): DbPhoto[] {
  return [...list].sort(
    (a, b) =>
      (a.position ?? 0) - (b.position ?? 0) ||
      a.year.localeCompare(b.year) ||
      a.created_at.localeCompare(b.created_at)
  );
}
