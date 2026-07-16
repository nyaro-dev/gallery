import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import PhotoImage from "@/components/ui/PhotoImage";
import type { Photo } from "@/lib/photos";

type PhotoStackProps = {
  photos: Photo[];
  active: number;
  vw: number;
  vh: number;
  isNarrow: boolean;
  onOpen: () => void;
};

const BASE_STYLE: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: 320,
  height: 320,
  transition:
    "transform 0.75s cubic-bezier(.22,.61,.36,1), opacity 0.7s ease",
  backfaceVisibility: "hidden",
};

// Chargement en deux temps : les photos proches de l'active (et les
// débuts de chapitre, visibles au loin) chargent en priorité ; une
// fois ces images chargées, le reste de la pile se monte par vagues,
// des plus proches aux plus lointaines.
const WINDOW_BEHIND = 3;
const WINDOW_AHEAD = 14;
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 350;
// Filet : ne bloque jamais la suite si une image prioritaire traîne.
const PRIORITY_FALLBACK_MS = 6000;

function isPriority(rel: number, isChapterStart: boolean) {
  return rel >= -WINDOW_BEHIND && (rel <= WINDOW_AHEAD || isChapterStart);
}

export default function PhotoStack({
  photos,
  active,
  vw,
  vh,
  isNarrow,
  onOpen,
}: PhotoStackProps) {
  const [deferredReady, setDeferredReady] = useState(false);
  const [revealBatch, setRevealBatch] = useState(0);
  const settledRef = useRef<Set<string>>(new Set());
  const priorityIdsRef = useRef<string[]>([]);

  useEffect(() => {
    priorityIdsRef.current = photos
      .filter((p, i) => isPriority(i - active, p.isChapterStart))
      .map((p) => p.id);
  }, [photos, active]);

  const markSettled = useCallback((id: string) => {
    settledRef.current.add(id);
    if (priorityIdsRef.current.every((pid) => settledRef.current.has(pid))) {
      setDeferredReady(true);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDeferredReady(true), PRIORITY_FALLBACK_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!deferredReady || revealBatch * BATCH_SIZE >= photos.length) return;
    const t = setTimeout(() => setRevealBatch((b) => b + 1), BATCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [deferredReady, revealBatch, photos.length]);

  // Ordre de révélation des photos différées : des plus proches de
  // l'active aux plus lointaines.
  const deferredOrder = new Map<string, number>();
  photos
    .map((p, i) => ({ id: p.id, rel: i - active, cs: p.isChapterStart }))
    .filter((x) => !isPriority(x.rel, x.cs))
    .sort((a, b) => Math.abs(a.rel) - Math.abs(b.rel))
    .forEach((x, order) => deferredOrder.set(x.id, order));

  const activeChapter = photos[active].chapterIndex;
  const relX = isNarrow ? 7 : 10;
  const relY = isNarrow ? 4 : 5;
  const cjx = isNarrow ? 50 : 92;
  const cjy = isNarrow ? 30 : 54;
  const nextStart = photos.findIndex((p, idx) => idx > active && p.isChapterStart);

  const stageScale = isNarrow
    ? Math.min(0.9, vw / 470, vh / 780)
    : Math.max(0.4, Math.min(1, vw / 1220, vh / 780));
  const sceneTransform = isNarrow
    ? "rotateX(-6deg) rotateY(-15deg) rotateZ(-1deg)"
    : "rotateX(-15deg) rotateY(-23deg) rotateZ(-2deg)";
  const sceneTop = isNarrow ? "61%" : "50%";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        perspective: 1600,
        perspectiveOrigin: "32% 46%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: sceneTop,
          width: 320,
          height: 320,
          transform: `translate(-50%, -50%) scale(${stageScale}) ${sceneTransform}`,
          transformStyle: "preserve-3d",
        }}
      >
        {photos.map((p, i) => {
          const rel = i - active;
          let boxStyle: CSSProperties;
          let showLabel = false;
          const isFront = rel === 0;

          if (rel < 0) {
            boxStyle = {
              ...BASE_STYLE,
              transform: "translate(-1500px, 820px) scale(1.28)",
              opacity: 0,
              zIndex: 900 + rel,
              pointerEvents: "none",
            };
          } else if (rel === 0) {
            boxStyle = {
              ...BASE_STYLE,
              transform: "translate(0px, 0px) scale(1)",
              opacity: 1,
              zIndex: 1000,
              pointerEvents: "auto",
            };
            showLabel = true;
          } else {
            const cd = p.chapterIndex - activeChapter;
            const sc = p.isChapterStart ? Math.max(0.58, 0.9 - cd * 0.13) : 0.72;
            const op = p.isChapterStart
              ? Math.max(0.16, 0.85 - cd * 0.16)
              : Math.max(0.1, 0.6 - cd * 0.16);
            const tx = rel * relX + cd * cjx;
            const ty = rel * -relY + cd * -cjy;
            boxStyle = {
              ...BASE_STYLE,
              transform: `translate(${tx}px, ${ty}px) scale(${sc})`,
              opacity: op,
              zIndex: 1000 - rel,
              pointerEvents: "none",
            };
            showLabel = i === nextStart && !isNarrow;
          }

          return (
            <div key={p.id} style={boxStyle}>
              {showLabel && (
                <div
                  style={{
                    position: "absolute",
                    left: 1,
                    top: -52,
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ width: 3, height: 19, background: "#a01e1e" }} />
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        letterSpacing: "0.3em",
                        lineHeight: 1.45,
                        color: "#ece6dc",
                      }}
                    >
                      {p.chapterName}
                    </div>
                    {isFront && (
                      <div
                        style={{
                          fontFamily: "var(--font-display), serif",
                          fontStyle: "italic",
                          fontSize: 17,
                          color: "#b0a99e",
                          marginTop: 5,
                        }}
                      >
                        {p.year} · {p.title}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {isFront && (
                <div
                  style={{
                    position: "absolute",
                    top: -52,
                    left: 0,
                    width: 1,
                    height: 52,
                    background: "rgba(236,230,220,0.5)",
                  }}
                />
              )}
              {isPriority(rel, p.isChapterStart) ||
              (deferredReady &&
                (deferredOrder.get(p.id) ?? Infinity) <
                  revealBatch * BATCH_SIZE) ? (
                <PhotoImage
                  src={p.src}
                  alt={[p.year, p.title].filter(Boolean).join(" — ") || "Souvenir"}
                  sizes="320px"
                  preload={isFront}
                  quality={45}
                  desaturated
                  colorOnHover
                  onSettled={() => markSettled(p.id)}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(135deg, #16120f 0%, #0f0c0a 100%)",
                    border: "1px solid rgba(216,210,200,0.04)",
                  }}
                />
              )}
              {isFront && (
                <a
                  href="#"
                  className="btn-souvenir"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpen();
                  }}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "100%",
                    transform: "translate(-50%, -50%)",
                    border: "1px solid rgba(216,210,200,0.5)",
                    padding: "13px 30px",
                    fontSize: 11,
                    letterSpacing: "0.32em",
                    color: "#d8d2c8",
                    whiteSpace: "nowrap",
                    background: "rgba(11,9,8,0.72)",
                    transition: "border-color 0.4s ease, color 0.4s ease",
                  }}
                >
                  VOIR LE SOUVENIR
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
