"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

type PhotoImageProps = {
  src: string;
  alt: string;
  /** Taille rendue pour l'optimiseur d'images, ex. "320px" ou "100vw". */
  sizes?: string;
  /** Précharge l'image (LCP, vue immersive). */
  preload?: boolean;
  /** Qualité d'optimisation — doit figurer dans images.qualities. */
  quality?: number;
  /** Rendu noir & blanc (filtre CSS). */
  desaturated?: boolean;
  /** Retour à la couleur au survol (avec `desaturated`). */
  colorOnHover?: boolean;
  /** Appelé quand l'image est chargée (ou en échec définitif). */
  onSettled?: () => void;
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
  preload = false,
  quality = 75,
  desaturated = false,
  colorOnHover = false,
  onSettled,
  className = "",
  style,
}: PhotoImageProps) {
  // Si l'optimiseur échoue (timeout sur un original lourd), on retombe
  // sur l'image d'origine servie telle quelle.
  const [optimizationFailed, setOptimizationFailed] = useState(false);

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
        preload={preload}
        loading={preload ? "eager" : "lazy"}
        quality={quality}
        unoptimized={optimizationFailed}
        onLoad={onSettled}
        onError={() => {
          // Second échec (déjà en non-optimisé) : on considère l'image réglée.
          if (optimizationFailed) onSettled?.();
          setOptimizationFailed(true);
        }}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
