import { supabase, type DbChapter, type DbPhoto } from "./supabase";
import {
  chapters as placeholderChapters,
  photos as placeholderPhotos,
  type Photo,
} from "./photos";

export type GalleryData = {
  chapters: { name: string }[];
  photos: Photo[];
};

/**
 * Charge chapitres et photos depuis Supabase.
 * Les placeholders locaux ne servent de repli que si la base est
 * injoignable ou pas encore initialisée — dès qu'elle répond, la
 * galerie reflète son contenu réel (même vide).
 */
export async function getGalleryData(): Promise<GalleryData> {
  try {
    const [chaptersRes, photosRes] = await Promise.all([
      supabase
        .from("chapters")
        .select("*")
        .order("position")
        .order("created_at"),
      supabase.from("photos").select("*").order("year").order("created_at"),
    ]);
    if (chaptersRes.error) throw chaptersRes.error;
    if (photosRes.error) throw photosRes.error;

    const chapters = (chaptersRes.data ?? []) as DbChapter[];
    const dbPhotos = (photosRes.data ?? []) as DbPhoto[];

    const photos: Photo[] = [];
    chapters.forEach((ch, ci) => {
      dbPhotos
        .filter((p) => p.chapter_id === ch.id)
        .forEach((p, pi) =>
          photos.push({
            seed: p.id,
            id: p.id,
            year: p.year,
            title: p.title,
            desc: p.description,
            src: p.image_url,
            colorSrc: p.image_url,
            chapterIndex: ci,
            chapterName: ch.name,
            isChapterStart: pi === 0,
          })
        );
    });

    return { chapters: chapters.map((c) => ({ name: c.name })), photos };
  } catch {
    return {
      chapters: placeholderChapters.map((c) => ({ name: c.name })),
      photos: placeholderPhotos,
    };
  }
}
