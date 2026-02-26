"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";

/**
 * 36 patent diagrams as giant floating wraiths with JS-driven physics.
 *
 * Architecture:
 *   Fixed fullscreen container (overflow hidden, clips at viewport).
 *   Each tile is a particle with position, velocity, and opacity phase.
 *   A requestAnimationFrame loop handles:
 *     1. Movement (slow drift, ~0.15 px/frame)
 *     2. Arena boundary bounce
 *     3. AABB collision detection with 100 px buffer (tiles never overlap)
 *     4. Sinusoidal opacity cycling (2 %–45 %, staggered phases)
 *     5. Direct DOM style updates (no React state re-renders)
 *
 * Size by complexity (preserved from design approval):
 *   complex → 47 vw
 *   medium  → 37 vw
 *   simple  → 27 vw
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

/* Display width per complexity as fraction of viewport width */
const sizeVwMap: Record<Complexity, number> = {
  complex: 47,
  medium: 37,
  simple: 27,
};

/* ── Physics constants ─────────────────────────────────────── */
const BUFFER = 100;          // minimum gap between tile borders (px)
const SPEED = 0.12;          // base speed (px per frame at 60 fps)
const OPACITY_MIN = 0.02;
const OPACITY_MAX = 0.45;
const OPACITY_CYCLE_S = 25;  // seconds per full opacity cycle
const ARENA_MULT = 8;        // arena is this many × the viewport

/* ── Particle state ────────────────────────────────────────── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pw: number;   // pixel width
  ph: number;   // pixel height
  opPhase: number; // opacity phase offset (radians)
}

export default function PatentDiagramBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const particles = useRef<Particle[]>([]);
  const rafId = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const reducedMotion = useRef(false);

  /* Convert tile definitions to initial pixel sizes */
  const computeSizes = useCallback(() => {
    const vw = window.innerWidth;
    return tiles.map((t) => {
      const pw = (sizeVwMap[t.complexity] / 100) * vw;
      const ph = pw * (t.h / t.w);
      return { pw, ph };
    });
  }, []);

  /* Place tiles in a non-overlapping grid within the arena */
  const initParticles = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const arenaW = vw * ARENA_MULT;
    const arenaH = vh * ARENA_MULT;
    const sizes = computeSizes();

    const placed: Particle[] = [];

    // Sort by area descending so large tiles get placed first
    const indices = tiles.map((_, i) => i);
    indices.sort((a, b) => (sizes[b].pw * sizes[b].ph) - (sizes[a].pw * sizes[a].ph));

    // Grid-based placement with jitter for natural look
    const cols = 6;
    const rows = 6;
    const cellW = arenaW / cols;
    const cellH = arenaH / rows;

    for (let idx = 0; idx < indices.length; idx++) {
      const i = indices[idx];
      const { pw, ph } = sizes[i];

      // Assign to grid cell
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      // Center in cell with random jitter
      const jitterX = (Math.random() - 0.5) * Math.max(0, cellW - pw - BUFFER * 2) * 0.6;
      const jitterY = (Math.random() - 0.5) * Math.max(0, cellH - ph - BUFFER * 2) * 0.6;

      const x = col * cellW + (cellW - pw) / 2 + jitterX;
      const y = row * cellH + (cellH - ph) / 2 + jitterY;

      // Random velocity direction, fixed speed
      const angle = Math.random() * Math.PI * 2;
      const speed = SPEED * (0.7 + Math.random() * 0.6); // slight variation

      placed[i] = {
        x: Math.max(BUFFER, Math.min(arenaW - pw - BUFFER, x)),
        y: Math.max(BUFFER, Math.min(arenaH - ph - BUFFER, y)),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        pw,
        ph,
        opPhase: (i / tiles.length) * Math.PI * 2, // stagger opacity phases
      };
    }

    particles.current = placed;
  }, [computeSizes]);

  /* Resize handler — recompute sizes, keep relative positions */
  const handleResize = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const arenaW = vw * ARENA_MULT;
    const arenaH = vh * ARENA_MULT;
    const sizes = computeSizes();

    particles.current.forEach((p, i) => {
      const { pw, ph } = sizes[i];
      // Scale position proportionally
      if (p.pw > 0) {
        p.x = (p.x / (p.pw * ARENA_MULT / sizeVwMap[tiles[i].complexity])) *
              (pw * ARENA_MULT / sizeVwMap[tiles[i].complexity]);
      }
      p.pw = pw;
      p.ph = ph;
      // Clamp to arena
      p.x = Math.max(BUFFER, Math.min(arenaW - pw - BUFFER, p.x));
      p.y = Math.max(BUFFER, Math.min(arenaH - ph - BUFFER, p.y));
    });
  }, [computeSizes]);

  /* Main animation loop */
  const animate = useCallback((timestamp: number) => {
    if (!lastTime.current) lastTime.current = timestamp;
    const dt = Math.min((timestamp - lastTime.current) / 16.667, 3); // normalise to 60fps, cap at 3×
    lastTime.current = timestamp;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const arenaW = vw * ARENA_MULT;
    const arenaH = vh * ARENA_MULT;

    const ps = particles.current;
    const n = ps.length;

    // 1. Move particles
    for (let i = 0; i < n; i++) {
      const p = ps[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // 2. Arena boundary bounce
    for (let i = 0; i < n; i++) {
      const p = ps[i];
      if (p.x < BUFFER) { p.x = BUFFER; p.vx = Math.abs(p.vx); }
      if (p.y < BUFFER) { p.y = BUFFER; p.vy = Math.abs(p.vy); }
      if (p.x + p.pw > arenaW - BUFFER) { p.x = arenaW - BUFFER - p.pw; p.vx = -Math.abs(p.vx); }
      if (p.y + p.ph > arenaH - BUFFER) { p.y = arenaH - BUFFER - p.ph; p.vy = -Math.abs(p.vy); }
    }

    // 3. AABB collision detection & bounce (with BUFFER gap)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = ps[i];
        const b = ps[j];

        // Check overlap including buffer
        const overlapX = (a.x + a.pw + BUFFER) - b.x;
        const overlapX2 = (b.x + b.pw + BUFFER) - a.x;
        const overlapY = (a.y + a.ph + BUFFER) - b.y;
        const overlapY2 = (b.y + b.ph + BUFFER) - a.y;

        if (overlapX > 0 && overlapX2 > 0 && overlapY > 0 && overlapY2 > 0) {
          // They overlap (including buffer). Find minimum separation axis.
          const penetrations = [overlapX, overlapX2, overlapY, overlapY2];
          const minPen = Math.min(...penetrations);
          const minIdx = penetrations.indexOf(minPen);

          const pushEach = minPen / 2 + 1;

          switch (minIdx) {
            case 0: // a is left of b, push apart on X
              a.x -= pushEach;
              b.x += pushEach;
              a.vx = -Math.abs(a.vx);
              b.vx = Math.abs(b.vx);
              break;
            case 1: // b is left of a
              b.x -= pushEach;
              a.x += pushEach;
              b.vx = -Math.abs(b.vx);
              a.vx = Math.abs(a.vx);
              break;
            case 2: // a is above b, push apart on Y
              a.y -= pushEach;
              b.y += pushEach;
              a.vy = -Math.abs(a.vy);
              b.vy = Math.abs(b.vy);
              break;
            case 3: // b is above a
              b.y -= pushEach;
              a.y += pushEach;
              b.vy = -Math.abs(b.vy);
              a.vy = Math.abs(a.vy);
              break;
          }
        }
      }
    }

    // 4. Re-clamp to arena after collision resolution
    for (let i = 0; i < n; i++) {
      const p = ps[i];
      p.x = Math.max(BUFFER, Math.min(arenaW - BUFFER - p.pw, p.x));
      p.y = Math.max(BUFFER, Math.min(arenaH - BUFFER - p.ph, p.y));
    }

    // 5. Compute opacity & update DOM
    const timeSec = timestamp / 1000;
    // Viewport offset: center of viewport is at center of arena
    const offsetX = (arenaW - vw) / 2;
    const offsetY = (arenaH - vh) / 2;

    for (let i = 0; i < n; i++) {
      const el = tileRefs.current[i];
      if (!el) continue;

      const p = ps[i];
      const screenX = p.x - offsetX;
      const screenY = p.y - offsetY;

      // Sinusoidal opacity
      const opCycle = Math.sin(timeSec * (Math.PI * 2 / OPACITY_CYCLE_S) + p.opPhase);
      const opacity = OPACITY_MIN + (OPACITY_MAX - OPACITY_MIN) * ((opCycle + 1) / 2);

      el.style.transform = `translate(${screenX}px, ${screenY}px)`;
      el.style.opacity = String(opacity);
    }

    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Check reduced motion preference
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = mql.matches;

    if (reducedMotion.current) {
      // Static display at fixed opacity
      tileRefs.current.forEach((el) => {
        if (el) el.style.opacity = "0.25";
      });
      return;
    }

    initParticles();

    // Apply initial positions immediately
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const arenaW = vw * ARENA_MULT;
    const arenaH = vh * ARENA_MULT;
    const offsetX = (arenaW - vw) / 2;
    const offsetY = (arenaH - vh) / 2;

    particles.current.forEach((p, i) => {
      const el = tileRefs.current[i];
      if (!el) return;
      el.style.transform = `translate(${p.x - offsetX}px, ${p.y - offsetY}px)`;
      el.style.opacity = String(OPACITY_MIN);
      el.style.width = `${p.pw}px`;
    });

    rafId.current = requestAnimationFrame(animate);

    const onResize = () => handleResize();
    window.addEventListener("resize", onResize);

    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
      if (e.matches) {
        cancelAnimationFrame(rafId.current);
        tileRefs.current.forEach((el) => {
          if (el) {
            el.style.opacity = "0.25";
            el.style.animation = "none";
          }
        });
      } else {
        initParticles();
        lastTime.current = 0;
        rafId.current = requestAnimationFrame(animate);
      }
    };
    mql.addEventListener("change", onMotionChange);

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener("resize", onResize);
      mql.removeEventListener("change", onMotionChange);
    };
  }, [animate, initParticles, handleResize]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {tiles.map((tile, i) => (
        <div
          key={i}
          ref={(el) => { tileRefs.current[i] = el; }}
          className="absolute top-0 left-0 will-change-[transform,opacity]"
          style={{
            width: `${sizeVwMap[tile.complexity]}vw`,
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
      ))}
    </div>
  );
}
