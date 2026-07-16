import Gallery from "@/components/gallery/Gallery";
import { getGalleryData } from "@/lib/gallery-data";

// Les souvenirs viennent de Supabase : toujours servir des données fraîches.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { chapters, photos } = await getGalleryData();
  return <Gallery chapters={chapters} photos={photos} />;
}
