import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Les originaux du bucket peuvent être lourds : laisse le temps à
    // l'optimiseur (sharp) sous une rafale de requêtes (défaut : 7s).
    imgOptTimeoutInSeconds: 30,
  },
  images: {
    // 45 : vignettes N&B de la pile · 60 : cartes admin · 85 : vue immersive
    qualities: [45, 60, 75, 85],
    // 1920px suffit pour la vue immersive — évite les variantes 2048/3840.
    deviceSizes: [640, 828, 1080, 1200, 1920],
    // Les fichiers du bucket sont immuables (noms UUID) : cache long.
    minimumCacheTTL: 2678400, // 31 jours
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
      {
        protocol: "https",
        hostname: "zquwcnrplxtumsauwbea.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
