// Particules déterministes (dérivées de l'index) pour éviter tout
// écart de rendu entre serveur et client.
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 7.3 + 3) % 100,
  top: (i * 13.7 + 6) % 92,
  size: 1 + (i % 3),
  delay: -(i * 1.9),
  dur: 12 + (i % 5) * 3,
  op: 0.08 + (i % 4) * 0.05,
}));

export default function DustParticles() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {PARTICLES.map((d, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: "#cfc8bd",
            opacity: d.op,
            filter: "blur(0.6px)",
            animation: `dustDrift ${d.dur}s ${d.delay}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}
