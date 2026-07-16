import Image from "next/image";
import type { CSSProperties } from "react";

type PhotoImageProps = {
  src: string;
  alt: string;
  /** Taille rendue pour l'optimiseur d'images, ex. "320px" ou "100vw". */
  sizes?: string;
  priority?: boolean;
  /** Rendu noir & blanc (filtre CSS). */
  desaturated?: boolean;
  /** Retour à la couleur au survol (avec `desaturated`). */
  colorOnHover?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Image générique : remplit son conteneur (object-fit: cover) avec
 * option noir & blanc / couleur au survol. Le dimensionnement est
 * contrôlé par le parent via className/style.
 */
export default function PhotoImage({
  src,
  alt,
  sizes = "100vw",
  priority = false,
  desaturated = false,
  colorOnHover = false,
  className = "",
  style,
}: PhotoImageProps) {
  const filterClass = desaturated
    ? colorOnHover
      ? "photo-desaturated photo-color-on-hover"
      : "photo-desaturated"
    : "";

  return (
    <div
      className={`${filterClass} ${className}`.trim()}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
