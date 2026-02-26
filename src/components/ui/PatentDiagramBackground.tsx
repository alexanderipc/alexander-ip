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
 * Subtle animated patent drawing background.
 * Renders a grid of real patent illustrations at very low opacity
 * with a slow diagonal drift animation.
 */
export default function PatentDiagramBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Animated grid — doubled for seamless loop */}
      <div className="patent-drift absolute -inset-[50%] flex flex-wrap items-start justify-center gap-16 opacity-[0.04]">
        {/* Render drawings twice to fill the oversized canvas */}
        {[...diagrams, ...diagrams, ...diagrams, ...diagrams].map(
          (d, i) => (
            <div
              key={i}
              className="flex-shrink-0"
              style={{
                width: `${Math.round(d.w * 0.4)}px`,
                height: `${Math.round(d.h * 0.4)}px`,
              }}
            >
              <Image
                src={d.src}
                alt=""
                width={d.w}
                height={d.h}
                className="w-full h-full object-contain blur-[0.5px]"
                loading="lazy"
                quality={40}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
