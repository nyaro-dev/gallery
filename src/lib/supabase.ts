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
  created_at: string;
};
