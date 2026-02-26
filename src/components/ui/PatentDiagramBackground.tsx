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
  { top: "-5%", left: "-5%", scale: 0.38 },
  { top: "8%", left: "55%", scale: 0.32 },
  { top: "-8%", left: "30%", scale: 0.35 },
  { top: "45%", left: "-8%", scale: 0.30 },
  { top: "50%", left: "42%", scale: 0.34 },
  { top: "35%", left: "72%", scale: 0.30 },
  { top: "70%", left: "15%", scale: 0.36 },
  // Second pass — offset duplicates for fuller coverage
  { top: "20%", left: "10%", scale: 0.28 },
  { top: "65%", left: "60%", scale: 0.32 },
  { top: "-2%", left: "78%", scale: 0.30 },
  { top: "80%", left: "45%", scale: 0.28 },
  { top: "25%", left: "88%", scale: 0.26 },
  { top: "75%", left: "-3%", scale: 0.30 },
  { top: "55%", left: "25%", scale: 0.26 },
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
      <div className="patent-drift absolute -inset-[15%] opacity-[0.07]">
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
                className="w-full h-full object-contain blur-[0.3px]"
                loading="lazy"
                quality={40}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
