"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import ImmersiveModal from "@/components/ui/ImmersiveModal";
import PhotoImage from "@/components/ui/PhotoImage";
import ChapterNav from "./ChapterNav";
import DustParticles from "./DustParticles";
import PhotoStack from "./PhotoStack";
import type { Photo } from "@/lib/photos";

type GalleryProps = {
  chapters: { name: string }[];
  photos: Photo[];
};

export default function Gallery({ chapters, photos }: GalleryProps) {
  const [active, setActive] = useState(0);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ vw: 1280, vh: 800 });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const modalOpen = modalIndex != null;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () =>
      setViewport({ vw: el.clientWidth, vh: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const openModal = useCallback(() => setModalIndex(active), [active]);
  const closeModal = useCallback(() => setModalIndex(null), []);

  const goNext = useCallback(
    () => setActive((a) => Math.min(a + 1, photos.length - 1)),
    [photos.length]
  );
  const goPrev = useCallback(() => setActive((a) => Math.max(a - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen || photos.length === 0) return; // Échap est géré par le modal
      if (["ArrowRight", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
        goNext();
      } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, photos.length, goNext, goPrev]);

  // Navigation tactile : balayage horizontal sur la scène.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start || modalOpen || photos.length === 0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    [modalOpen, photos.length, goNext, goPrev]
  );

  const goChapter = useCallback(
    (ci: number) => {
      const idx = photos.findIndex((p) => p.chapterIndex === ci);
      if (idx >= 0) setActive(idx);
    },
    [photos]
  );

  const isNarrow = viewport.vw < 760;
  const activeChapter = photos.length > 0 ? photos[active].chapterIndex : 0;
  const modalPhoto = modalIndex != null ? (photos[modalIndex] ?? null) : null;

  const titleStyle: CSSProperties = isNarrow
    ? {
        position: "absolute",
        left: 0,
        right: 0,
        top: "clamp(24px,5vh,44px)",
        textAlign: "center",
      }
    : {
        position: "absolute",
        left: "clamp(18px,4vw,56px)",
        top: "clamp(22px,4.5vh,46px)",
      };

  const sloganStyle: CSSProperties = isNarrow
    ? {
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "clamp(62px,10vh,92px)",
        maxWidth: "84vw",
        textAlign: "center",
      }
    : {
        position: "absolute",
        left: "clamp(18px,4vw,56px)",
        bottom: "clamp(24px,4vh,42px)",
        maxWidth: "min(340px,42vw)",
      };

  const sloganDashStyle: CSSProperties = isNarrow
    ? { width: 26, height: 1, background: "#a01e1e", margin: "0 auto 14px" }
    : { width: 26, height: 1, background: "#a01e1e", marginBottom: 16 };

  return (
    <div
      ref={rootRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: "relative",
        width: "100%",
        height: "100dvh",
        minHeight: 640,
        // "clip" (et non "hidden") : empêche le scroll-into-view au focus
        // de décaler la scène clippée.
        overflow: "clip",
        background:
          "radial-gradient(1300px 850px at 40% 42%, #1b1512 0%, #0f0c0a 55%, #080606 100%)",
        fontFamily: "var(--font-body), sans-serif",
        color: "#d8d2c8",
      }}
    >
      {/* traînée lumineuse derrière la pile */}
      <div
        style={{
          position: "absolute",
          left: "34%",
          top: "12%",
          width: "62%",
          height: "60%",
          transform: "rotate(-6deg)",
          background:
            "radial-gradient(55% 45% at 35% 60%, rgba(214,207,196,0.09) 0%, rgba(214,207,196,0) 70%)",
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      {photos.length > 0 ? (
        <PhotoStack
          photos={photos}
          active={active}
          vw={viewport.vw}
          vh={viewport.vh}
          isNarrow={isNarrow}
          onOpen={openModal}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: isNarrow ? "58%" : "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            maxWidth: "min(420px, 84vw)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 26,
              height: 1,
              background: "#a01e1e",
              margin: "0 auto 18px",
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "clamp(18px,2.4vw,24px)",
              lineHeight: 1.5,
              color: "#c9c2b7",
              marginBottom: 28,
              textWrap: "pretty",
            }}
          >
            L&apos;album attend ses premiers souvenirs.
          </div>
          <Link
            href="/gestion"
            className="btn-souvenir"
            style={{
              display: "inline-block",
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
            AJOUTER DES SOUVENIRS
          </Link>
        </div>
      )}

      <DustParticles />

      {modalPhoto && (
        <ImmersiveModal
          open
          onClose={closeModal}
          backdrop={
            <PhotoImage
              src={modalPhoto.colorSrc}
              alt={
                [modalPhoto.year, modalPhoto.title].filter(Boolean).join(" — ") ||
                "Souvenir"
              }
              sizes="100vw"
              preload
              quality={85}
              style={{ position: "absolute", inset: 0 }}
            />
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              marginBottom: 22,
            }}
          >
            <div style={{ width: 3, height: 20, background: "#a01e1e" }} />
            <div
              style={{ fontSize: 12, letterSpacing: "0.34em", color: "#d8d2c8" }}
            >
              {modalPhoto.year} · {modalPhoto.chapterName}
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 600,
              fontSize: "clamp(38px,6vw,66px)",
              lineHeight: 1.02,
              color: "#f4efe6",
              marginBottom: 22,
            }}
          >
            {modalPhoto.title}
          </div>
          <div
            style={{
              fontSize: "clamp(14px,1.6vw,16px)",
              lineHeight: 1.75,
              color: "#c9c2b7",
              textWrap: "pretty",
            }}
          >
            {modalPhoto.desc}
          </div>
        </ImmersiveModal>
      )}

      {/* flèches tactiles (mobile) */}
      {isNarrow && photos.length > 0 && (
        <>
          {(
            [
              { label: "‹", action: goPrev, side: { left: 12 }, disabled: active === 0 },
              { label: "›", action: goNext, side: { right: 12 }, disabled: active === photos.length - 1 },
            ] as const
          ).map((btn) => (
            <button
              key={btn.label}
              aria-label={btn.label === "‹" ? "Photo précédente" : "Photo suivante"}
              onClick={btn.action}
              disabled={btn.disabled}
              style={{
                position: "absolute",
                top: "61%",
                transform: "translateY(-50%)",
                ...btn.side,
                width: 42,
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(216,210,200,0.4)",
                borderRadius: "50%",
                background: "rgba(11,9,8,0.55)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                color: "#d8d2c8",
                fontSize: 22,
                fontWeight: 200,
                lineHeight: 1,
                paddingBottom: 3,
                zIndex: 30,
                opacity: btn.disabled ? 0.25 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              {btn.label}
            </button>
          ))}
        </>
      )}

      {/* grain */}
      <div className="film-grain" />

      {/* titre */}
      <div style={titleStyle}>
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 600,
            fontSize: "clamp(30px,4.4vw,46px)",
            lineHeight: 1.02,
            color: "#ece6dc",
          }}
        >
          Maman,
        </div>
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(17px,2.4vw,26px)",
            color: "#b0a99e",
            marginTop: 4,
          }}
        >
          au fil des années
        </div>
      </div>

      {/* repère temporel */}
      {!isNarrow && (
        <div
          style={{
            position: "absolute",
            right: 40,
            top: 120,
            writingMode: "vertical-rl",
            fontSize: 10,
            letterSpacing: "0.34em",
            color: "#7d766c",
          }}
        >
          1976 — AUJOURD&apos;HUI
        </div>
      )}

      <ChapterNav
        chapters={chapters}
        activeChapter={activeChapter}
        isNarrow={isNarrow}
        onSelect={goChapter}
      />

      {/* bas gauche */}
      <div style={sloganStyle}>
        <div style={sloganDashStyle} />
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(15px,1.8vw,21px)",
            lineHeight: 1.45,
            color: "#c9c2b7",
            textWrap: "pretty",
          }}
        >
          Les années filent, ton sourire reste. Ici, le temps s&apos;arrête un
          instant - juste pour toi, maman.
        </div>
      </div>

      {/* bas droite (desktop) / sous le slogan (mobile) */}
      <Link
        href="/gestion"
        className="discover-link"
        style={
          isNarrow
            ? {
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: "clamp(18px,3vh,30px)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 10,
                letterSpacing: "0.3em",
                color: "#a8a196",
                whiteSpace: "nowrap",
              }
            : {
                position: "absolute",
                right: "clamp(18px,4vw,56px)",
                bottom: "clamp(24px,4vh,36px)",
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 10,
                letterSpacing: "0.3em",
                color: "#a8a196",
              }
        }
      >
          <span
            className="discover-plus"
            style={{
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              border: "1px solid rgba(216,210,200,0.4)",
              borderRadius: "50%",
              fontSize: 20,
              fontWeight: 200,
              lineHeight: 0,
              letterSpacing: "normal",
              paddingBottom: 2,
              boxSizing: "border-box",
              transition:
                "border-color 0.35s ease, background 0.35s ease, color 0.35s ease",
            }}
          >
            +
          </span>
        <span style={{ lineHeight: 1 }}>DÉCOUVRIR L&apos;HISTOIRE</span>
      </Link>
    </div>
  );
}
