"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BUCKET, supabase, type DbChapter, type DbPhoto } from "@/lib/supabase";
import PhotoCard from "./PhotoCard";
import UploadZone from "./UploadZone";

type Status = "loading" | "ready" | "setup-needed";

type Upload = { tempId: string; fileName: string };

function sortPhotos(list: DbPhoto[]) {
  return [...list].sort(
    (a, b) =>
      a.year.localeCompare(b.year) || a.created_at.localeCompare(b.created_at)
  );
}

export default function AdminPanel() {
  const [status, setStatus] = useState<Status>("loading");
  const [chapters, setChapters] = useState<DbChapter[]>([]);
  const [photos, setPhotos] = useState<DbPhoto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [newChapter, setNewChapter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, error = false) => {
    setToast({ text, error });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), error ? 5000 : 2600);
  }, []);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from("chapters").select("*").order("position").order("created_at"),
      supabase.from("photos").select("*"),
    ]).then(([chaptersRes, photosRes]) => {
      if (cancelled) return;
      if (chaptersRes.error || photosRes.error) {
        setStatus("setup-needed");
        return;
      }
      const chs = (chaptersRes.data ?? []) as DbChapter[];
      setChapters(chs);
      setPhotos(sortPhotos((photosRes.data ?? []) as DbPhoto[]));
      setSelectedId((sel) => sel ?? chs[0]?.id ?? null);
      setStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // ---------- Chapitres ----------

  const addChapter = async () => {
    const name = newChapter.trim();
    if (!name) return;
    const position =
      chapters.length > 0 ? Math.max(...chapters.map((c) => c.position)) + 1 : 0;
    const { data, error } = await supabase
      .from("chapters")
      .insert({ name, position })
      .select()
      .single();
    if (error || !data) {
      showToast("Impossible de créer le chapitre.", true);
      return;
    }
    setChapters((c) => [...c, data as DbChapter]);
    setNewChapter("");
    setSelectedId((data as DbChapter).id);
    showToast(`Chapitre « ${name} » créé.`);
  };

  const renameChapter = async (id: string) => {
    const name = editName.trim();
    setEditingId(null);
    const current = chapters.find((c) => c.id === id);
    if (!current || !name || name === current.name) return;
    setChapters((cs) => cs.map((c) => (c.id === id ? { ...c, name } : c)));
    const { error } = await supabase.from("chapters").update({ name }).eq("id", id);
    if (error) {
      setChapters((cs) => cs.map((c) => (c.id === id ? current : c)));
      showToast("Le renommage a échoué.", true);
    }
  };

  const moveChapter = async (id: string, dir: -1 | 1) => {
    const idx = chapters.findIndex((c) => c.id === id);
    const other = chapters[idx + dir];
    if (!other) return;
    const me = chapters[idx];
    const swapped = chapters.map((c) =>
      c.id === me.id
        ? { ...c, position: other.position }
        : c.id === other.id
          ? { ...c, position: me.position }
          : c
    );
    setChapters([...swapped].sort((a, b) => a.position - b.position));
    const [r1, r2] = await Promise.all([
      supabase.from("chapters").update({ position: other.position }).eq("id", me.id),
      supabase.from("chapters").update({ position: me.position }).eq("id", other.id),
    ]);
    if (r1.error || r2.error) {
      setChapters(chapters);
      showToast("Le déplacement a échoué.", true);
    }
  };

  const deleteChapter = async (id: string) => {
    setConfirmDeleteId(null);
    const chapterPhotos = photos.filter((p) => p.chapter_id === id);
    const paths = chapterPhotos
      .map((p) => p.storage_path)
      .filter((p): p is string => !!p);
    const { error } = await supabase.from("chapters").delete().eq("id", id);
    if (error) {
      showToast("La suppression a échoué.", true);
      return;
    }
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    setChapters((cs) => cs.filter((c) => c.id !== id));
    setPhotos((ps) => ps.filter((p) => p.chapter_id !== id));
    setSelectedId((sel) =>
      sel === id ? (chapters.find((c) => c.id !== id)?.id ?? null) : sel
    );
    showToast("Chapitre supprimé.");
  };

  // ---------- Photos ----------

  const uploadFiles = async (files: File[]) => {
    if (!selectedId) return;
    const chapterId = selectedId;
    await Promise.all(
      files.map(async (file) => {
        const tempId = crypto.randomUUID();
        setUploads((u) => [...u, { tempId, fileName: file.name }]);
        try {
          const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${chapterId}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { contentType: file.type });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
          const baseTitle = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
          const { data, error: insErr } = await supabase
            .from("photos")
            .insert({
              chapter_id: chapterId,
              image_url: pub.publicUrl,
              storage_path: path,
              title: baseTitle,
            })
            .select()
            .single();
          if (insErr || !data) throw insErr ?? new Error("insert failed");
          setPhotos((ps) => sortPhotos([...ps, data as DbPhoto]));
        } catch {
          showToast(`Échec de l'envoi de « ${file.name} ».`, true);
        } finally {
          setUploads((u) => u.filter((x) => x.tempId !== tempId));
        }
      })
    );
  };

  const updatePhoto = useCallback(
    async (
      id: string,
      patch: Partial<Pick<DbPhoto, "year" | "title" | "description">>
    ) => {
      const { error } = await supabase.from("photos").update(patch).eq("id", id);
      if (error) {
        showToast("L'enregistrement a échoué.", true);
        return false;
      }
      setPhotos((ps) =>
        sortPhotos(ps.map((p) => (p.id === id ? { ...p, ...patch } : p)))
      );
      return true;
    },
    [showToast]
  );

  const movePhoto = useCallback(
    async (photo: DbPhoto, chapterId: string) => {
      const target = chapters.find((c) => c.id === chapterId);
      if (!target) return;
      setPhotos((ps) =>
        sortPhotos(
          ps.map((p) => (p.id === photo.id ? { ...p, chapter_id: chapterId } : p))
        )
      );
      const { error } = await supabase
        .from("photos")
        .update({ chapter_id: chapterId })
        .eq("id", photo.id);
      if (error) {
        setPhotos((ps) =>
          sortPhotos(ps.map((p) => (p.id === photo.id ? photo : p)))
        );
        showToast("Le déplacement a échoué.", true);
        return;
      }
      showToast(`Souvenir déplacé vers « ${target.name} ».`);
    },
    [chapters, showToast]
  );

  const deletePhoto = useCallback(
    async (photo: DbPhoto) => {
      const { error } = await supabase.from("photos").delete().eq("id", photo.id);
      if (error) {
        showToast("La suppression a échoué.", true);
        return;
      }
      if (photo.storage_path)
        await supabase.storage.from(BUCKET).remove([photo.storage_path]);
      setPhotos((ps) => ps.filter((p) => p.id !== photo.id));
      showToast("Souvenir supprimé.");
    },
    [showToast]
  );

  // ---------- Rendu ----------

  const selected = chapters.find((c) => c.id === selectedId) ?? null;
  const chapterPhotos = photos.filter((p) => p.chapter_id === selectedId);

  const heading = (
    <header
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 40,
      }}
    >
      <div>
        <Link
          href="/"
          style={{
            fontSize: 11,
            letterSpacing: "0.26em",
            color: "#8f887c",
            display: "inline-block",
            marginBottom: 14,
          }}
        >
          ← RETOUR À LA GALERIE
        </Link>
        <h1
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 600,
            fontSize: "clamp(30px,4vw,42px)",
            lineHeight: 1.05,
            color: "#ece6dc",
            margin: 0,
          }}
        >
          Gestion des souvenirs
        </h1>
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontSize: "clamp(15px,1.8vw,20px)",
            color: "#b0a99e",
            marginTop: 4,
          }}
        >
          chapitres, photos et récits
        </div>
      </div>
      <div style={{ width: 26, height: 1, background: "#a01e1e", marginBottom: 12 }} />
    </header>
  );

  if (status === "loading") {
    return (
      <Shell>
        {heading}
        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#8f887c" }}>
          <div className="spinner" />
          <span style={{ fontSize: 12, letterSpacing: "0.2em" }}>CHARGEMENT…</span>
        </div>
      </Shell>
    );
  }

  if (status === "setup-needed") {
    return (
      <Shell>
        {heading}
        <div
          className="photo-card fade-up"
          style={{ maxWidth: 620, padding: "34px 34px 30px" }}
        >
          <div
            style={{
              fontFamily: "var(--font-display), serif",
              fontSize: 24,
              color: "#ece6dc",
              marginBottom: 14,
            }}
          >
            La base de données n&apos;est pas encore initialisée
          </div>
          <ol
            style={{
              fontSize: 14,
              lineHeight: 1.8,
              color: "#c9c2b7",
              paddingLeft: 18,
              margin: "0 0 22px",
              listStyle: "decimal",
            }}
          >
            <li>
              Ouvre le{" "}
              <a
                href="https://supabase.com/dashboard/project/zquwcnrplxtumsauwbea/sql/new"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#e0b7b7", borderBottom: "1px solid rgba(224,183,183,0.4)" }}
              >
                SQL Editor de ton projet Supabase
              </a>
            </li>
            <li>
              Colle le contenu du fichier <code style={{ color: "#ece6dc" }}>supabase/setup.sql</code>{" "}
              (à la racine du projet) et exécute-le
            </li>
            <li>Reviens ici et réessaie</li>
          </ol>
          <button
            className="admin-btn"
            onClick={() => {
              setStatus("loading");
              setAttempt((a) => a + 1);
            }}
          >
            Réessayer
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {heading}
      <div className="admin-layout">
        {/* ----- Chapitres ----- */}
        <aside>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.26em",
              color: "#8f887c",
              marginBottom: 14,
            }}
          >
            CHAPITRES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {chapters.map((ch, idx) => (
              <div
                key={ch.id}
                className={`chapter-row${ch.id === selectedId ? " selected" : ""}`}
                onClick={() => setSelectedId(ch.id)}
              >
                {editingId === ch.id ? (
                  <input
                    className="admin-input"
                    style={{ padding: "4px 8px", fontSize: 12 }}
                    value={editName}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => renameChapter(ch.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameChapter(ch.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      letterSpacing: "0.22em",
                      color: ch.id === selectedId ? "#ece6dc" : "#a8a196",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ch.name}
                  </span>
                )}
                <span
                  style={{ fontSize: 11, color: "#6e675d", flex: "0 0 auto" }}
                  title="Nombre de souvenirs"
                >
                  {photos.filter((p) => p.chapter_id === ch.id).length}
                </span>
                <div className="chapter-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="admin-icon-btn"
                    disabled={idx === 0}
                    onClick={() => moveChapter(ch.id, -1)}
                    title="Monter"
                  >
                    ↑
                  </button>
                  <button
                    className="admin-icon-btn"
                    disabled={idx === chapters.length - 1}
                    onClick={() => moveChapter(ch.id, 1)}
                    title="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    className="admin-icon-btn"
                    onClick={() => {
                      setEditingId(ch.id);
                      setEditName(ch.name);
                    }}
                    title="Renommer"
                  >
                    ✎
                  </button>
                  {confirmDeleteId === ch.id ? (
                    <button
                      className="admin-icon-btn"
                      style={{ color: "#e05a5a", width: "auto", padding: "0 6px", fontSize: 10, letterSpacing: "0.08em" }}
                      onClick={() => deleteChapter(ch.id)}
                      onMouseLeave={() => setConfirmDeleteId(null)}
                      title="Confirmer la suppression"
                    >
                      SÛR ?
                    </button>
                  ) : (
                    <button
                      className="admin-icon-btn"
                      onClick={() => setConfirmDeleteId(ch.id)}
                      title="Supprimer"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <input
              className="admin-input"
              placeholder="Nouveau chapitre…"
              value={newChapter}
              onChange={(e) => setNewChapter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addChapter()}
            />
            <button
              className="admin-btn"
              onClick={addChapter}
              disabled={!newChapter.trim()}
            >
              Ajouter
            </button>
          </div>
        </aside>

        {/* ----- Photos ----- */}
        <main>
          {selected ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  marginBottom: 18,
                }}
              >
                <div style={{ width: 3, height: 16, background: "#a01e1e", alignSelf: "center" }} />
                <div style={{ fontSize: 13, letterSpacing: "0.28em", color: "#ece6dc" }}>
                  {selected.name}
                </div>
                <div style={{ fontSize: 12, color: "#6e675d" }}>
                  {chapterPhotos.length} souvenir{chapterPhotos.length > 1 ? "s" : ""}
                </div>
              </div>

              <UploadZone onFiles={uploadFiles} />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: 20,
                  marginTop: 24,
                }}
              >
                {uploads.map((u) => (
                  <div
                    key={u.tempId}
                    className="photo-card fade-up"
                    style={{
                      aspectRatio: "4 / 3",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 14,
                    }}
                  >
                    <div className="spinner" />
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        color: "#8f887c",
                        maxWidth: "80%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.fileName}
                    </div>
                  </div>
                ))}
                {chapterPhotos.map((p) => (
                  <PhotoCard
                    key={p.id}
                    photo={p}
                    chapters={chapters}
                    onUpdate={updatePhoto}
                    onMove={movePhoto}
                    onDelete={deletePhoto}
                  />
                ))}
              </div>

              {chapterPhotos.length === 0 && uploads.length === 0 && (
                <div
                  style={{
                    marginTop: 24,
                    fontFamily: "var(--font-display), serif",
                    fontStyle: "italic",
                    fontSize: 17,
                    color: "#8f887c",
                  }}
                >
                  Aucun souvenir dans ce chapitre pour l&apos;instant — glisse des
                  images ci-dessus pour commencer.
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontSize: 17,
                color: "#8f887c",
              }}
            >
              Crée un premier chapitre pour commencer.
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className={`admin-toast${toast.error ? " error" : ""}`}>{toast.text}</div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(1300px 850px at 40% 0%, #17110e 0%, #0f0c0a 55%, #080606 100%)",
        color: "#d8d2c8",
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(24px,5vw,56px)" }}>
        {children}
      </div>
    </div>
  );
}
