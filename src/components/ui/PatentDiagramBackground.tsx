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
 * Each position has a wraith animation config:
 * - anim: which keyframe set (1-4, each drifts a different direction)
 * - duration: cycle length in seconds (desynchronises the images)
 * - delay: negative delay so each image starts at a random phase
 */
const positions = [
  { top: "-5%",  left: "-5%",  scale: 0.55, anim: 1, dur: 65,  delay: 0 },
  { top: "5%",   left: "52%",  scale: 0.48, anim: 2, dur: 82,  delay: -18 },
  { top: "-8%",  left: "28%",  scale: 0.50, anim: 3, dur: 56,  delay: -35 },
  { top: "42%",  left: "-8%",  scale: 0.45, anim: 4, dur: 74,  delay: -8 },
  { top: "48%",  left: "40%",  scale: 0.50, anim: 1, dur: 60,  delay: -42 },
  { top: "32%",  left: "70%",  scale: 0.45, anim: 3, dur: 70,  delay: -22 },
  { top: "68%",  left: "12%",  scale: 0.52, anim: 2, dur: 78,  delay: -50 },
  // Second pass — offset duplicates for fuller coverage
  { top: "18%",  left: "8%",   scale: 0.42, anim: 4, dur: 66,  delay: -12 },
  { top: "62%",  left: "58%",  scale: 0.48, anim: 1, dur: 72,  delay: -30 },
  { top: "-2%",  left: "76%",  scale: 0.44, anim: 3, dur: 85,  delay: -55 },
  { top: "78%",  left: "42%",  scale: 0.42, anim: 2, dur: 62,  delay: -5 },
  { top: "22%",  left: "86%",  scale: 0.38, anim: 4, dur: 77,  delay: -40 },
  { top: "72%",  left: "-3%",  scale: 0.44, anim: 1, dur: 68,  delay: -26 },
  { top: "52%",  left: "22%",  scale: 0.40, anim: 2, dur: 75,  delay: -48 },
];

/**
 * Ethereal patent drawing background.
 * Each illustration drifts independently side-to-side with its own
 * opacity cycle — some fading in while others fade out, like wraiths
 * shifting through mist. Max opacity stays around 12-14%.
 */
export default function PatentDiagramBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <div className="absolute -inset-[15%]">
        {positions.map((pos, i) => {
          const d = diagrams[i % diagrams.length];
          return (
            <div
              key={i}
              className="absolute wraith-image"
              style={{
                top: pos.top,
                left: pos.left,
                width: `${Math.round(d.w * pos.scale)}px`,
                height: `${Math.round(d.h * pos.scale)}px`,
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
    </div>
  );
}
