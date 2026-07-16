import type { CSSProperties } from "react";

type ChapterNavProps = {
  chapters: { name: string }[];
  activeChapter: number;
  isNarrow: boolean;
  onSelect: (chapterIndex: number) => void;
};

export default function ChapterNav({
  chapters,
  activeChapter,
  isNarrow,
  onSelect,
}: ChapterNavProps) {
  const navStyle: CSSProperties = isNarrow
    ? {
        position: "absolute",
        left: 16,
        right: 16,
        top: "clamp(150px,19vh,202px)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "12px 24px",
        zIndex: 20,
      }
    : {
        position: "absolute",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 26,
        zIndex: 20,
      };

  return (
    <nav style={navStyle}>
      {chapters.map((ch, ci) => {
        const on = ci === activeChapter;
        return (
          <a
            key={ch.name}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSelect(ci);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 12,
              letterSpacing: "0.3em",
              transition: "color 0.4s ease",
            }}
          >
            <span
              style={{
                display: isNarrow ? "none" : "block",
                width: 26,
                height: 1,
                background: on ? "#c22222" : "#5a544c",
                transition: "background 0.4s ease",
              }}
            />
            <span
              style={{
                color: on ? "#c22222" : "#8f887c",
                borderBottom: on
                  ? "1px solid #c22222"
                  : "1px solid transparent",
                paddingBottom: 5,
                transition: "color 0.4s ease, border-color 0.4s ease",
              }}
            >
              {ch.name}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
