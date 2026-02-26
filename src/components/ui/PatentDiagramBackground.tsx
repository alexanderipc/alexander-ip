import Image from "next/image";

const diagrams = [
  { src: "/images/diagrams/industrial-equipment.webp", w: 600, h: 352 },
  { src: "/images/diagrams/heat-exchanger.webp", w: 514, h: 600 },
  { src: "/images/diagrams/engine-cross-section.webp", w: 600, h: 451 },
  { src: "/images/diagrams/filter-system.webp", w: 600, h: 429 },
  { src: "/images/diagrams/snowboard-bindings.webp", w: 600, h: 385 },
  { src: "/images/diagrams/wheel-assembly.webp", w: 600, h: 523 },
  { src: "/images/diagrams/bracket-mount.webp", w: 600, h: 455 },
];

/* Fixed positions for scattered placement (% based, top/left) */
const positions = [
  { top: "-5%", left: "-5%", scale: 0.55 },
  { top: "5%", left: "52%", scale: 0.48 },
  { top: "-8%", left: "28%", scale: 0.50 },
  { top: "42%", left: "-8%", scale: 0.45 },
  { top: "48%", left: "40%", scale: 0.50 },
  { top: "32%", left: "70%", scale: 0.45 },
  { top: "68%", left: "12%", scale: 0.52 },
  // Second pass — offset duplicates for fuller coverage
  { top: "18%", left: "8%", scale: 0.42 },
  { top: "62%", left: "58%", scale: 0.48 },
  { top: "-2%", left: "76%", scale: 0.44 },
  { top: "78%", left: "42%", scale: 0.42 },
  { top: "22%", left: "86%", scale: 0.38 },
  { top: "72%", left: "-3%", scale: 0.44 },
  { top: "52%", left: "22%", scale: 0.40 },
];

/**
 * Subtle animated patent drawing background.
 * Renders real patent illustrations scattered across the hero area
 * at low opacity with a slow diagonal drift animation.
 */
export default function PatentDiagramBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <div className="patent-drift absolute -inset-[15%] opacity-[0.12]">
        {positions.map((pos, i) => {
          const d = diagrams[i % diagrams.length];
          return (
            <div
              key={i}
              className="absolute"
              style={{
                top: pos.top,
                left: pos.left,
                width: `${Math.round(d.w * pos.scale)}px`,
                height: `${Math.round(d.h * pos.scale)}px`,
              }}
            >
              <Image
                src={d.src}
                alt=""
                width={d.w}
                height={d.h}
                className="w-full h-full object-contain"
                loading="eager"
                quality={40}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
