"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const CLOSE_DURATION_MS = 430;

type ImmersiveModalProps = {
  open: boolean;
  onClose: () => void;
  /** Fond plein écran (typiquement une PhotoImage en fill). */
  backdrop: ReactNode;
  /** Contenu affiché en bas à gauche, animé à l'ouverture. */
  children: ReactNode;
};

/**
 * Modal immersif générique : fond plein écran, dégradés de lisibilité,
 * animations d'ouverture/fermeture et fermeture via Échap ou le bouton ×.
 */
export default function ImmersiveModal({
  open,
  onClose,
  backdrop,
  children,
}: ImmersiveModalProps) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(() => {
      closingRef.current = false;
      setClosing(false);
      onClose();
    }, CLOSE_DURATION_MS);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 6000,
        overflow: "hidden",
        animation: closing
          ? "modalOut 0.42s cubic-bezier(.4,0,.2,1) both"
          : "modalScrim 0.45s ease both",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          animation: "modalRise 0.75s cubic-bezier(.22,.61,.36,1) both",
        }}
      >
        {backdrop}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(6,5,4,0.92) 0%, rgba(6,5,4,0.66) 34%, rgba(6,5,4,0.15) 62%, rgba(6,5,4,0) 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(6,5,4,0.7) 0%, rgba(6,5,4,0) 40%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "7%",
          bottom: "14%",
          maxWidth: "min(520px,86vw)",
          animation: "modalText 0.8s cubic-bezier(.22,.61,.36,1) 0.15s both",
        }}
      >
        {children}
      </div>
      <a
        href="#"
        aria-label="Fermer"
        className="modal-close"
        onClick={(e) => {
          e.preventDefault();
          requestClose();
        }}
        style={{
          position: "absolute",
          right: 40,
          top: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 46,
          height: 46,
          border: "1px solid rgba(244,239,230,0.4)",
          borderRadius: "50%",
          color: "#f4efe6",
          fontSize: 20,
          fontWeight: 300,
          lineHeight: 1,
          background: "rgba(11,9,8,0.45)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "border-color 0.35s ease, background 0.35s ease",
        }}
      >
        ×
      </a>
    </div>
  );
}
