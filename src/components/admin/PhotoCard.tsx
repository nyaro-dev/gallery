"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { DbChapter, DbPhoto } from "@/lib/supabase";

type PhotoCardProps = {
  photo: DbPhoto;
  chapters: DbChapter[];
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (
    id: string,
    patch: Partial<Pick<DbPhoto, "year" | "title" | "description">>
  ) => Promise<boolean>;
  onMove: (photo: DbPhoto, chapterId: string) => void;
  onReorder: (photo: DbPhoto, dir: -1 | 1) => void;
  onDelete: (photo: DbPhoto) => void;
};

export default function PhotoCard({
  photo,
  chapters,
  isFirst,
  isLast,
  onUpdate,
  onMove,
  onReorder,
  onDelete,
}: PhotoCardProps) {
  const [draft, setDraft] = useState({
    year: photo.year,
    title: photo.title,
    description: photo.description,
  });
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = async (field: keyof typeof draft) => {
    if (draft[field] === photo[field]) return;
    const ok = await onUpdate(photo.id, { [field]: draft[field] });
    if (ok) {
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 1800);
    }
  };

  return (
    <div className="photo-card fade-up" style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden" }}>
        <Image
          src={photo.image_url}
          alt={photo.title || "Souvenir"}
          fill
          sizes="(max-width: 760px) 100vw, 320px"
          quality={60}
          loading="lazy"
          style={{ objectFit: "cover", opacity: deleting ? 0.3 : 1, transition: "opacity 0.3s ease" }}
        />
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 8,
            display: "flex",
            gap: 6,
          }}
        >
          <button
            className="admin-btn"
            style={{ padding: "5px 12px", fontSize: 11, background: "rgba(11,9,8,0.85)" }}
            disabled={isFirst}
            onClick={() => onReorder(photo, -1)}
            title="Avancer dans le chapitre"
            aria-label="Avancer la photo"
          >
            ←
          </button>
          <button
            className="admin-btn"
            style={{ padding: "5px 12px", fontSize: 11, background: "rgba(11,9,8,0.85)" }}
            disabled={isLast}
            onClick={() => onReorder(photo, 1)}
            title="Reculer dans le chapitre"
            aria-label="Reculer la photo"
          >
            →
          </button>
        </div>
        <div
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            display: "flex",
            gap: 6,
          }}
        >
          {confirming ? (
            <>
              <button
                className="admin-btn admin-btn-danger"
                style={{ padding: "5px 10px", fontSize: 10, background: "rgba(11,9,8,0.85)" }}
                onClick={() => {
                  setDeleting(true);
                  onDelete(photo);
                }}
                disabled={deleting}
              >
                {deleting ? "…" : "Supprimer ?"}
              </button>
              <button
                className="admin-btn"
                style={{ padding: "5px 10px", fontSize: 10, background: "rgba(11,9,8,0.85)" }}
                onClick={() => setConfirming(false)}
                disabled={deleting}
              >
                Non
              </button>
            </>
          ) : (
            <button
              className="admin-btn admin-btn-danger"
              style={{ padding: "5px 12px", fontSize: 11, background: "rgba(11,9,8,0.85)" }}
              onClick={() => setConfirming(true)}
              aria-label="Supprimer la photo"
            >
              ×
            </button>
          )}
        </div>
        {saved && (
          <div
            style={{
              position: "absolute",
              left: 8,
              bottom: 8,
              padding: "4px 10px",
              background: "rgba(11,9,8,0.85)",
              border: "1px solid rgba(216,210,200,0.3)",
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "#b6e0b6",
            }}
          >
            ENREGISTRÉ ✓
          </div>
        )}
      </div>

      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="admin-input"
            style={{ width: 80, flex: "0 0 auto" }}
            placeholder="Année"
            value={draft.year}
            maxLength={12}
            onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value }))}
            onBlur={() => commit("year")}
          />
          <input
            className="admin-input"
            placeholder="Titre du souvenir"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            onBlur={() => commit("title")}
          />
        </div>
        <textarea
          className="admin-input"
          placeholder="Description…"
          value={draft.description}
          rows={2}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          onBlur={() => commit("description")}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              flex: "0 0 auto",
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "#8f887c",
            }}
          >
            CHAPITRE
          </span>
          <select
            className="admin-input"
            style={{ cursor: "pointer", padding: "7px 10px", fontSize: 12 }}
            value={photo.chapter_id}
            onChange={(e) => {
              if (e.target.value !== photo.chapter_id) onMove(photo, e.target.value);
            }}
          >
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
