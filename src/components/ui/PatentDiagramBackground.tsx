import Image from "next/image";

/**
 * 36 patent diagrams as giant floating wraiths that slide on and off
 * the screen from the edges. Each image is enormous (80–140 vw wide)
 * and translates across viewport-scale distances via CSS animations.
 *
 * Architecture:
 *   Outer div: fixed fullscreen, overflow hidden (clips at viewport)
 *   Inner div: oversized 6-col grid (160 vw × 160 vh, offset −30 vw/vh)
 *   Each cell: overflow visible — images extend far beyond their cells
 *   Each image: one of 8 wraithSlide animation variants (70–130 s)
 *
 * Size by complexity:
 *   complex → 140 vw (~8× the old grid-cell size)
 *   medium  → 110 vw
 *   simple  →  80 vw
 */

type Complexity = "complex" | "medium" | "simple";

interface TileDef {
  src: string;
  w: number;
  h: number;
  complexity: Complexity;
}

/* Tiles interleaved by complexity for even visual distribution */
const tiles: TileDef[] = [
  // ── Row 1 ──
  { src: "/images/diagrams/engine-cross-section.webp", w: 600, h: 451, complexity: "complex" },
  { src: "/images/diagrams/knee-brace.webp", w: 548, h: 800, complexity: "medium" },
  { src: "/images/diagrams/cylindrical-column.webp", w: 334, h: 800, complexity: "simple" },
  { src: "/images/diagrams/engine-block-gears.webp", w: 800, h: 602, complexity: "complex" },
  { src: "/images/diagrams/cable-car-system.webp", w: 799, h: 729, complexity: "medium" },
  { src: "/images/diagrams/cloud-wearable-schematic.webp", w: 800, h: 629, complexity: "simple" },

  // ── Row 2 ──
  { src: "/images/diagrams/pipe-clamp-3d.webp", w: 777, h: 800, complexity: "medium" },
  { src: "/images/diagrams/portable-device-internals.webp", w: 800, h: 470, complexity: "complex" },
  { src: "/images/diagrams/dynamic-ads-flowchart.webp", w: 800, h: 497, complexity: "simple" },
  { src: "/images/diagrams/pipe-clamp-dimensioned.webp", w: 797, h: 800, complexity: "medium" },
  { src: "/images/diagrams/smart-garment-sensors.webp", w: 800, h: 574, complexity: "complex" },
  { src: "/images/diagrams/valve-manifold.webp", w: 800, h: 681, complexity: "simple" },

  // ── Row 3 ──
  { src: "/images/diagrams/panel-tray.webp", w: 800, h: 688, complexity: "simple" },
  { src: "/images/diagrams/3d-chip-stack.webp", w: 800, h: 664, complexity: "complex" },
  { src: "/images/diagrams/holographic-storage.webp", w: 800, h: 195, complexity: "medium" },
  { src: "/images/diagrams/bracket-mount-2.webp", w: 800, h: 607, complexity: "simple" },
  { src: "/images/diagrams/neural-network-diagram.webp", w: 800, h: 787, complexity: "complex" },
  { src: "/images/diagrams/hook-assembly-exploded.webp", w: 618, h: 800, complexity: "medium" },

  // ── Row 4 ──
  { src: "/images/diagrams/ai-luggage-sorting.webp", w: 800, h: 595, complexity: "complex" },
  { src: "/images/diagrams/hook-assembly-complete.webp", w: 675, h: 800, complexity: "medium" },
  { src: "/images/diagrams/snowboard-bindings-full.webp", w: 800, h: 514, complexity: "simple" },
  { src: "/images/diagrams/pen-cross-section.webp", w: 800, h: 605, complexity: "complex" },
  { src: "/images/diagrams/vr-headset.webp", w: 800, h: 609, complexity: "medium" },
  { src: "/images/diagrams/industrial-equipment.webp", w: 600, h: 352, complexity: "simple" },

  // ── Row 5 ──
  { src: "/images/diagrams/snowboard-bindings.webp", w: 600, h: 385, complexity: "simple" },
  { src: "/images/diagrams/fluid-treatment-system.webp", w: 800, h: 572, complexity: "complex" },
  { src: "/images/diagrams/pen-exterior.webp", w: 800, h: 598, complexity: "medium" },
  { src: "/images/diagrams/gear-mechanism.webp", w: 800, h: 643, complexity: "medium" },
  { src: "/images/diagrams/heat-exchanger-coils.webp", w: 685, h: 800, complexity: "complex" },
  { src: "/images/diagrams/wheel-traction-device.webp", w: 800, h: 698, complexity: "medium" },

  // ── Row 6 ──
  { src: "/images/diagrams/rollator-walker.webp", w: 657, h: 800, complexity: "complex" },
  { src: "/images/diagrams/hook-assembly-labeled.webp", w: 800, h: 784, complexity: "medium" },
  { src: "/images/diagrams/filter-system.webp", w: 600, h: 429, complexity: "medium" },
  { src: "/images/diagrams/heat-exchanger.webp", w: 514, h: 600, complexity: "complex" },
  { src: "/images/diagrams/bracket-mount.webp", w: 600, h: 455, complexity: "medium" },
  { src: "/images/diagrams/wheel-assembly.webp", w: 600, h: 523, complexity: "medium" },
];

/* Display width per complexity — every tile is enormous */
const sizeMap: Record<Complexity, string> = {
  complex: "140vw",
  medium: "110vw",
  simple: "80vw",
};

export default function PatentDiagramBackground() {
  return (
    <div
      className="fixed inset-0 z-[1] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="grid grid-cols-4 md:grid-cols-6"
        style={{
          width: "160vw",
          height: "160vh",
          marginLeft: "-30vw",
          marginTop: "-30vh",
        }}
      >
        {tiles.map((tile, i) => {
          const anim = (i % 8) + 1;
          const dur = 70 + ((i * 11) % 60);   // 70–130 s
          const delay = -((i * 17) % 120);     // stagger

          return (
            <div
              key={i}
              className="overflow-visible flex items-center justify-center"
            >
              <div
                className="wraith-image flex-shrink-0"
                style={{
                  width: sizeMap[tile.complexity],
                  animation: `wraithSlide${anim} ${dur}s ease-in-out ${delay}s infinite`,
                  opacity: 0,
                }}
              >
                <Image
                  src={tile.src}
                  alt=""
                  width={tile.w}
                  height={tile.h}
                  className="w-full h-auto"
                  loading="eager"
                  quality={40}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
