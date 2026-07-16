"use client";

import { useRef, useState, type DragEvent } from "react";

type UploadZoneProps = {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
};

export default function UploadZone({ onFiles, disabled }: UploadZoneProps) {
  const [dragover, setDragover] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pickImages = (list: FileList | null) => {
    if (!list) return;
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (images.length) onFiles(images);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragover(false);
    if (!disabled) pickImages(e.dataTransfer.files);
  };

  return (
    <div
      className={`dropzone${dragover ? " dragover" : ""}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragover(true);
      }}
      onDragLeave={() => setDragover(false)}
      onDrop={onDrop}
      style={{
        padding: "34px 20px",
        textAlign: "center",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.26em",
          color: "#a8a196",
          marginBottom: 8,
        }}
      >
        GLISSEZ VOS IMAGES ICI
      </div>
      <div style={{ fontSize: 12, color: "#6e675d" }}>
        ou cliquez pour parcourir — plusieurs fichiers possibles
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          pickImages(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
