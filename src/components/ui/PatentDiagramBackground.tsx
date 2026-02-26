import Image from "next/image";

/**
 * 36 unique patent diagrams arranged in a responsive CSS Grid.
 *
 * Complexity-based sizing:
 *   complex → minimal padding, image fills ~90% of cell (visually ~2× a simple tile)
 *   medium  → moderate padding, image fills ~65% of cell
 *   simple  → generous padding, image fills ~45% of cell
 *
 * The grid is slightly oversized (130vw × 130vh) and offset so tiles
 * bleed beyond the viewport edges for a more organic feel.
 * Each image animates independently via one of six wraithDrift keyframes
 * with varied durations (50–95 s) and staggered negative delays.
 *
 * Grid: 4 cols (mobile) → 6 cols (md+), auto rows, 60 px gap.
 * Sits at z-[1] BEHIND all page content (main/footer at z-[2]).
 */

type Complexity = "complex" | "medium" | "simple";

interface TileDef {
  src: string;
  w: number;
  h: number;
  complexity: Complexity;
}

/*
 * Tiles ordered for visual distribution — complexities interleaved so
 * intricate drawings are spread evenly across the grid.
 *
 * Row 1: C  M  S  C  M  S
 * Row 2: M  C  S  M  C  S
 * Row 3: S  C  M  S  C  M
 * Row 4: C  M  S  C  M  S
 * Row 5: S  C  M  M  C  M
 * Row 6: C  M  M  C  M  M
 */
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

/* Padding per complexity — less padding = image fills more of the cell */
const padMap: Record<Complexity, string> = {
  complex: "p-[8px]",
  medium: "p-[28px]",
  simple: "p-[48px]",
};

export default function PatentDiagramBackground() {
  return (
    <div
      className="fixed z-[1] pointer-events-none grid grid-cols-4 md:grid-cols-6 gap-6 md:gap-10 lg:gap-[60px]"
      style={{
        width: "130vw",
        height: "130vh",
        left: "-15vw",
        top: "-15vh",
      }}
      aria-hidden="true"
    >
      {tiles.map((tile, i) => {
        const anim = (i % 6) + 1;
        const dur = 50 + ((i * 7) % 45);
        const delay = -((i * 13) % 90);

        return (
          <div key={i} className="overflow-hidden">
            <div
              className={`wraith-image w-full h-full flex items-center justify-center ${padMap[tile.complexity]}`}
              style={{
                animation: `wraithDrift${anim} ${dur}s ease-in-out ${delay}s infinite`,
                opacity: 0,
              }}
            >
              <Image
                src={tile.src}
                alt=""
                width={tile.w}
                height={tile.h}
                className="max-w-full max-h-full object-contain"
                loading="eager"
                quality={40}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
