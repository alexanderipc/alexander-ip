import Image from "next/image";

/**
 * Seven unique patent diagrams arranged in a 3×3 CSS Grid.
 * More intricate devices get larger tiles (spanning 2 columns).
 * Each image appears exactly once — no duplicates on screen.
 *
 * Grid layout:
 *   Row 1: engine-cross (2 cols, LARGE)  |  filter (1 col)
 *   Row 2: bracket (1 col)               |  heat-exchanger (2 cols, LARGE)
 *   Row 3: wheel (1 col)  |  industrial (1 col)  |  snowboard (1 col)
 */
const tiles = [
  {
    src: "/images/diagrams/engine-cross-section.webp",
    w: 600,
    h: 451,
    col: "1 / 3",
    row: "1",
    anim: 1,
    dur: 68,
    delay: 0,
  },
  {
    src: "/images/diagrams/filter-system.webp",
    w: 600,
    h: 429,
    col: "3",
    row: "1",
    anim: 3,
    dur: 56,
    delay: -28,
  },
  {
    src: "/images/diagrams/bracket-mount.webp",
    w: 600,
    h: 455,
    col: "1",
    row: "2",
    anim: 4,
    dur: 74,
    delay: -10,
  },
  {
    src: "/images/diagrams/heat-exchanger.webp",
    w: 514,
    h: 600,
    col: "2 / 4",
    row: "2",
    anim: 2,
    dur: 82,
    delay: -38,
  },
  {
    src: "/images/diagrams/wheel-assembly.webp",
    w: 600,
    h: 523,
    col: "1",
    row: "3",
    anim: 1,
    dur: 60,
    delay: -50,
  },
  {
    src: "/images/diagrams/industrial-equipment.webp",
    w: 600,
    h: 352,
    col: "2",
    row: "3",
    anim: 3,
    dur: 72,
    delay: -18,
  },
  {
    src: "/images/diagrams/snowboard-bindings.webp",
    w: 600,
    h: 385,
    col: "3",
    row: "3",
    anim: 2,
    dur: 78,
    delay: -42,
  },
];

/**
 * Global patent-diagram wraith layer.
 *
 * Sits at z-[1] BEHIND all page content (main/footer at z-[2]).
 * White/light section backgrounds are made transparent via CSS so
 * the wraiths show through. Dark sections, cards, images, and
 * buttons all have opaque backgrounds that naturally block them.
 *
 * CSS Grid guarantees tiles never overlap. overflow:hidden on each
 * cell clips any drift animation. Each diagram appears exactly once.
 */
export default function PatentDiagramBackground() {
  return (
    <div
      className="fixed inset-0 z-[1] pointer-events-none grid grid-cols-3 grid-rows-3"
      aria-hidden="true"
    >
      {tiles.map((tile, i) => (
        <div
          key={i}
          className="overflow-hidden"
          style={{ gridColumn: tile.col, gridRow: tile.row }}
        >
          <div
            className="wraith-image w-[115%] h-[115%] -ml-[7.5%] -mt-[7.5%] flex items-center justify-center p-[1.5vw]"
            style={{
              animation: `wraithDrift${tile.anim} ${tile.dur}s ease-in-out ${tile.delay}s infinite`,
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
      ))}
    </div>
  );
}
