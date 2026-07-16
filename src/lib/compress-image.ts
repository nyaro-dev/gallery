const MAX_DIMENSION = 2560;
const JPEG_QUALITY = 0.85;
// En dessous de ce poids, un fichier déjà aux bonnes dimensions est
// envoyé tel quel.
const KEEP_ORIGINAL_BYTES = 800_000;

export type CompressedImage = {
  blob: Blob;
  ext: string;
  contentType: string;
};

/**
 * Compresse une image côté client avant upload : recadre à 2560px max
 * (côté le plus long) et ré-encode en JPEG. Les originaux de téléphone
 * (5-10 Mo) tombent ainsi sous ~1 Mo, ce qui accélère l'upload et
 * l'optimisation à l'affichage. En cas d'échec (format non décodable
 * par le navigateur), l'original est envoyé tel quel.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const originalExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const original: CompressedImage = {
    blob: file,
    ext: originalExt,
    contentType: file.type || "application/octet-stream",
  };
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
    );
    if (scale === 1 && file.size <= KEEP_ORIGINAL_BYTES) {
      bitmap.close();
      return original;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    // Ne garde la version compressée que si elle est réellement plus légère.
    if (!blob || blob.size >= file.size) return original;
    return { blob, ext: "jpg", contentType: "image/jpeg" };
  } catch {
    return original;
  }
}
