export type PhotoSeed = {
  year: string;
  title: string;
  seed: string;
  desc: string;
};

export type Chapter = {
  name: string;
  photos: PhotoSeed[];
};

export type Photo = PhotoSeed & {
  id: string;
  src: string;
  colorSrc: string;
  chapterIndex: number;
  chapterName: string;
  isChapterStart: boolean;
};

export const chapters: Chapter[] = [
  {
    name: "LES ANNÉES 60",
    photos: [
      { year: "1962", title: "Le mariage", seed: "maman-1962", desc: "Le jour où tout a commencé, sur les marches de la petite église de campagne, entre deux familles réunies." },
      { year: "1963", title: "La lune de miel", seed: "maman-1963", desc: "Une semaine volée au bord d'un lac, entre rires, cartes postales et promesses." },
      { year: "1965", title: "Le nouvel appartement", seed: "maman-1965", desc: "Les premières clés, les cartons empilés et l'odeur de peinture fraîche du tout premier chez-soi." },
      { year: "1966", title: "Le bal du village", seed: "maman-1966", desc: "Une robe cousue à la main et une nuit de danse qui s'est étirée jusqu'à l'aube." },
      { year: "1968", title: "Les vacances en Italie", seed: "maman-1968", desc: "La voiture chargée jusqu'au toit, cap sur le soleil et les places de la Toscane." },
      { year: "1969", title: "Le premier tourne-disque", seed: "maman-1969", desc: "Les 45 tours qui tournaient en boucle dans le salon, tout un été durant." },
    ],
  },
  {
    name: "LES ANNÉES 70",
    photos: [
      { year: "1972", title: "La 2CV bleue", seed: "maman-1972", desc: "Sa toute première voiture, celle des escapades du dimanche et des routes de campagne." },
      { year: "1973", title: "Le déménagement en ville", seed: "maman-1973", desc: "Quitter la campagne pour les lumières et l'agitation de la ville." },
      { year: "1974", title: "L'été à la mer", seed: "maman-1974", desc: "Le sable brûlant, les glaces fondues et les premiers coups de soleil de l'été." },
      { year: "1976", title: "La fête des voisins", seed: "maman-1976", desc: "De grandes tablées dressées dans la cour, qui se prolongeaient tard dans la nuit." },
      { year: "1978", title: "Le grand jardin", seed: "maman-1978", desc: "Les tomates, les rosiers et les longs après-midis passés les mains dans la terre." },
      { year: "1979", title: "Le réveillon", seed: "maman-1979", desc: "La maison pleine, les guirlandes accrochées et le champagne à minuit." },
    ],
  },
  {
    name: "LES ANNÉES 80",
    photos: [
      { year: "1981", title: "Le déménagement", seed: "maman-1981", desc: "Une nouvelle maison, plus grande, pour une famille qui ne cessait de grandir." },
      { year: "1982", title: "Le voyage en train", seed: "maman-1982", desc: "Le nez collé à la vitre, à traverser toute la France d'une traite." },
      { year: "1983", title: "La naissance", seed: "maman-1983", desc: "Le plus beau jour de tous, un tout petit être blotti au creux des bras." },
      { year: "1985", title: "Le premier vélo", seed: "maman-1985", desc: "Les premiers tours de roue mal assurés et les genoux écorchés." },
      { year: "1987", title: "Noël en famille", seed: "maman-1987", desc: "Le sapin trop grand pour le salon et les yeux émerveillés au petit matin." },
      { year: "1989", title: "L'école communale", seed: "maman-1989", desc: "Le cartable neuf sur le dos et la photo prise devant la grille de l'école." },
    ],
  },
  {
    name: "AUJOURD'HUI",
    photos: [
      { year: "2015", title: "Les petits-enfants", seed: "maman-2015", desc: "Une nouvelle génération de rires qui résonne à nouveau dans la maison." },
      { year: "2018", title: "Le jardin retrouvé", seed: "maman-2018", desc: "Retour à la terre, les mains encore vertes et le même bonheur simple." },
      { year: "2021", title: "L'anniversaire", seed: "maman-2021", desc: "Les bougies soufflées, la famille réunie et les souvenirs partagés à voix haute." },
      { year: "2023", title: "Le repas de famille", seed: "maman-2023", desc: "Une longue tablée, les plats qui circulent, comme au bon vieux temps." },
      { year: "2024", title: "Le portrait", seed: "maman-2024", desc: "Un regard doux et paisible, toute une vie qui se lit dans les yeux." },
      { year: "2025", title: "Le dernier été", seed: "maman-2025", desc: "La lumière dorée d'une fin d'après-midi qui ne veut pas s'éteindre." },
    ],
  },
];

// Placeholders temporaires (picsum.photos) — seront remplacés par Supabase Storage.
export const photos: Photo[] = chapters.flatMap((ch, ci) =>
  ch.photos.map((p, pi) => ({
    ...p,
    chapterIndex: ci,
    chapterName: ch.name,
    isChapterStart: pi === 0,
    id: `ph-${p.seed}`,
    src: `https://picsum.photos/seed/${p.seed}/500/500?grayscale`,
    colorSrc: `https://picsum.photos/seed/${p.seed}/1600/1000`,
  }))
);
