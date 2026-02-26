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

/**
 * Each position places a large diagram across the viewport.
 * - size: vw-based width (each image fills 1/4 to 1/3 of the page)
 * - anim: which wraithDrift keyframe set (1-4)
 * - dur/delay: unique timing so images desynchronise
 */
const positions = [
  { top: "-8%",  left: "-8%",  size: "34vw", anim: 1, dur: 68,  delay: 0 },
  { top: "8%",   left: "55%",  size: "30vw", anim: 2, dur: 86,  delay: -20 },
  { top: "-12%", left: "24%",  size: "32vw", anim: 3, dur: 58,  delay: -38 },
  { top: "40%",  left: "-10%", size: "28vw", anim: 4, dur: 76,  delay: -10 },
  { top: "48%",  left: "40%",  size: "35vw", anim: 1, dur: 62,  delay: -45 },
  { top: "28%",  left: "70%",  size: "30vw", anim: 3, dur: 72,  delay: -25 },
  { top: "68%",  left: "8%",   size: "32vw", anim: 2, dur: 80,  delay: -52 },
  { top: "18%",  left: "4%",   size: "28vw", anim: 4, dur: 68,  delay: -15 },
  { top: "62%",  left: "58%",  size: "34vw", anim: 1, dur: 74,  delay: -32 },
  { top: "82%",  left: "30%",  size: "30vw", anim: 2, dur: 65,  delay: -48 },
];

/**
 * Global patent-diagram wraith layer.
 * Fixed to the viewport so the diagrams drift behind/over all page
 * content. Each illustration moves independently — some fading in
 * while others dissolve — like technical ghosts in the mist.
 * Sits at z-40: above page content, below navbar (z-50).
 */
export default function PatentDiagramBackground() {
  return (
    <div
      className="fixed inset-0 z-40 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {positions.map((pos, i) => {
        const d = diagrams[i % diagrams.length];
        return (
          <div
            key={i}
            className="absolute wraith-image"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.size,
              aspectRatio: `${d.w} / ${d.h}`,
              animation: `wraithDrift${pos.anim} ${pos.dur}s ease-in-out ${pos.delay}s infinite`,
              opacity: 0,
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
  );
}
