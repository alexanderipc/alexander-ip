"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";

/**
 * 36 patent diagrams as ghostly floating wraiths with JS physics + lifecycle.
 *
 * Each tile drifts slowly, bounces off arena walls and other tiles (100 px
 * buffer — they never overlap). A state-machine governs each tile's opacity:
 *
 *   HIDDEN → FADING_IN → VISIBLE → FADING_OUT → COOLDOWN → HIDDEN …
 *
 * A "director" runs every frame and ensures at least 2 tiles are visibly
 * fading in or holding within the viewport. When a tile vanishes it stays
 * gone for 25–45 s before it can be chosen again — like a real wraith.
 *
 * On page load a complex diagram appears somewhat centrally first, then a
 * second tile fades in nearby.
 */

/* ── Tile catalogue ────────────────────────────────────────── */

type Complexity = "complex" | "medium" | "simple";

interface TileDef {
  src: string;
  w: number;
  h: number;
  complexity: Complexity;
}

const tiles: TileDef[] = [
  { src: "/images/diagrams/engine-cross-section.webp", w: 600, h: 451, complexity: "complex" },
  { src: "/images/diagrams/knee-brace.webp", w: 548, h: 800, complexity: "medium" },
  { src: "/images/diagrams/cylindrical-column.webp", w: 334, h: 800, complexity: "simple" },
  { src: "/images/diagrams/engine-block-gears.webp", w: 800, h: 602, complexity: "complex" },
  { src: "/images/diagrams/cable-car-system.webp", w: 799, h: 729, complexity: "medium" },
  { src: "/images/diagrams/cloud-wearable-schematic.webp", w: 800, h: 629, complexity: "simple" },
  { src: "/images/diagrams/pipe-clamp-3d.webp", w: 777, h: 800, complexity: "medium" },
  { src: "/images/diagrams/portable-device-internals.webp", w: 800, h: 470, complexity: "complex" },
  { src: "/images/diagrams/dynamic-ads-flowchart.webp", w: 800, h: 497, complexity: "simple" },
  { src: "/images/diagrams/pipe-clamp-dimensioned.webp", w: 797, h: 800, complexity: "medium" },
  { src: "/images/diagrams/smart-garment-sensors.webp", w: 800, h: 574, complexity: "complex" },
  { src: "/images/diagrams/valve-manifold.webp", w: 800, h: 681, complexity: "simple" },
  { src: "/images/diagrams/panel-tray.webp", w: 800, h: 688, complexity: "simple" },
  { src: "/images/diagrams/3d-chip-stack.webp", w: 800, h: 664, complexity: "complex" },
  { src: "/images/diagrams/holographic-storage.webp", w: 800, h: 195, complexity: "medium" },
  { src: "/images/diagrams/bracket-mount-2.webp", w: 800, h: 607, complexity: "simple" },
  { src: "/images/diagrams/neural-network-diagram.webp", w: 800, h: 787, complexity: "complex" },
  { src: "/images/diagrams/hook-assembly-exploded.webp", w: 618, h: 800, complexity: "medium" },
  { src: "/images/diagrams/ai-luggage-sorting.webp", w: 800, h: 595, complexity: "complex" },
  { src: "/images/diagrams/hook-assembly-complete.webp", w: 675, h: 800, complexity: "medium" },
  { src: "/images/diagrams/snowboard-bindings-full.webp", w: 800, h: 514, complexity: "simple" },
  { src: "/images/diagrams/pen-cross-section.webp", w: 800, h: 605, complexity: "complex" },
  { src: "/images/diagrams/vr-headset.webp", w: 800, h: 609, complexity: "medium" },
  { src: "/images/diagrams/industrial-equipment.webp", w: 600, h: 352, complexity: "simple" },
  { src: "/images/diagrams/snowboard-bindings.webp", w: 600, h: 385, complexity: "simple" },
  { src: "/images/diagrams/fluid-treatment-system.webp", w: 800, h: 572, complexity: "complex" },
  { src: "/images/diagrams/pen-exterior.webp", w: 800, h: 598, complexity: "medium" },
  { src: "/images/diagrams/gear-mechanism.webp", w: 800, h: 643, complexity: "medium" },
  { src: "/images/diagrams/heat-exchanger-coils.webp", w: 685, h: 800, complexity: "complex" },
  { src: "/images/diagrams/wheel-traction-device.webp", w: 800, h: 698, complexity: "medium" },
  { src: "/images/diagrams/rollator-walker.webp", w: 657, h: 800, complexity: "complex" },
  { src: "/images/diagrams/hook-assembly-labeled.webp", w: 800, h: 784, complexity: "medium" },
  { src: "/images/diagrams/filter-system.webp", w: 600, h: 429, complexity: "medium" },
  { src: "/images/diagrams/heat-exchanger.webp", w: 514, h: 600, complexity: "complex" },
  { src: "/images/diagrams/bracket-mount.webp", w: 600, h: 455, complexity: "medium" },
  { src: "/images/diagrams/wheel-assembly.webp", w: 600, h: 523, complexity: "medium" },
];

const sizeVwMap: Record<Complexity, number> = {
  complex: 47,
  medium: 37,
  simple: 27,
};

/* ── Physics ───────────────────────────────────────────────── */
const BUFFER = 100;        // min gap between any two tile edges (px)
const SPEED = 0.18;        // base drift (px / frame at 60 fps)
const ARENA_MULT = 4;      // arena = N × viewport in each dimension

/* ── Tile lifecycle (ms) ───────────────────────────────────── */
const OP_PEAK_LO = 0.35;
const OP_PEAK_HI = 0.48;
const FADE_IN_LO = 3000;   const FADE_IN_HI = 5000;
const HOLD_LO = 12000;     const HOLD_HI = 25000;
const FADE_OUT_LO = 3000;  const FADE_OUT_HI = 5000;
const COOL_LO = 25000;     const COOL_HI = 45000;

const MIN_VISIBLE = 2;     // director guarantees this many in viewport
const VP_MARGIN = 500;     // "near viewport" search radius (px)

/* ── States ────────────────────────────────────────────────── */
const HIDDEN = 0;
const FADING_IN = 1;
const VISIBLE = 2;
const FADING_OUT = 3;
const COOLDOWN = 4;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  pw: number; ph: number;
  state: number;
  stateT: number;         // timestamp when entered current state
  peak: number;           // peak opacity for this cycle
  fadeIn: number;         // fade-in duration (ms)
  hold: number;           // hold duration (ms)
  fadeOut: number;        // fade-out duration (ms)
  cool: number;           // cooldown duration (ms)
  complexity: Complexity;
}

/* ── Helpers ───────────────────────────────────────────────── */
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const ease = (t: number) => t * t * (3 - 2 * t);   // smoothstep

function tileOpacity(p: Particle, now: number): number {
  const dt = now - p.stateT;
  if (p.state === FADING_IN) {
    return ease(Math.max(0, Math.min(1, dt / p.fadeIn))) * p.peak;
  }
  if (p.state === VISIBLE) return p.peak;
  if (p.state === FADING_OUT) {
    return (1 - ease(Math.max(0, Math.min(1, dt / p.fadeOut)))) * p.peak;
  }
  return 0;                                          // HIDDEN / COOLDOWN
}

/** Advance the state machine; randomise durations when a cycle ends */
function tick(p: Particle, now: number) {
  const dt = now - p.stateT;
  if (p.state === FADING_IN && dt >= p.fadeIn) {
    p.state = VISIBLE; p.stateT = now;
  } else if (p.state === VISIBLE && dt >= p.hold) {
    p.state = FADING_OUT; p.stateT = now;
  } else if (p.state === FADING_OUT && dt >= p.fadeOut) {
    p.state = COOLDOWN; p.stateT = now;
    // pick fresh values for next appearance
    p.peak = rand(OP_PEAK_LO, OP_PEAK_HI);
    p.fadeIn = rand(FADE_IN_LO, FADE_IN_HI);
    p.hold = rand(HOLD_LO, HOLD_HI);
    p.fadeOut = rand(FADE_OUT_LO, FADE_OUT_HI);
    p.cool = rand(COOL_LO, COOL_HI);
  } else if (p.state === COOLDOWN && dt >= p.cool) {
    p.state = HIDDEN; p.stateT = now;
  }
}

function inViewport(
  p: Particle, ox: number, oy: number, vw: number, vh: number, margin = 0,
) {
  const sx = p.x - ox;
  const sy = p.y - oy;
  return sx + p.pw > -margin && sx < vw + margin &&
         sy + p.ph > -margin && sy < vh + margin;
}

/* ── Component ─────────────────────────────────────────────── */

export default function PatentDiagramBackground() {
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ps = useRef<Particle[]>([]);
  const raf = useRef(0);
  const prevT = useRef(0);

  /* pixel sizes for current viewport width */
  const sizes = useCallback(() => {
    const vw = window.innerWidth;
    return tiles.map((t) => {
      const pw = (sizeVwMap[t.complexity] / 100) * vw;
      return { pw, ph: pw * (t.h / t.w) };
    });
  }, []);

  /* ── Initialise particles ──────────────────────────────── */
  const init = useCallback((now: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const aw = vw * ARENA_MULT;
    const ah = vh * ARENA_MULT;
    const ox = (aw - vw) / 2;
    const oy = (ah - vh) / 2;
    const sz = sizes();

    const cols = 6, rows = 6;
    const cw = aw / cols, ch = ah / rows;

    const arr: Particle[] = tiles.map((t, i) => {
      const { pw, ph } = sz[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jx = (Math.random() - 0.5) * Math.max(0, cw - pw - BUFFER * 2) * 0.5;
      const jy = (Math.random() - 0.5) * Math.max(0, ch - ph - BUFFER * 2) * 0.5;
      let x = col * cw + (cw - pw) / 2 + jx;
      let y = row * ch + (ch - ph) / 2 + jy;
      x = Math.max(BUFFER, Math.min(aw - pw - BUFFER, x));
      y = Math.max(BUFFER, Math.min(ah - ph - BUFFER, y));

      const a = Math.random() * Math.PI * 2;
      const s = SPEED * (0.7 + Math.random() * 0.6);

      return {
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        pw, ph,
        state: HIDDEN,
        stateT: now,
        peak: rand(OP_PEAK_LO, OP_PEAK_HI),
        fadeIn: rand(FADE_IN_LO, FADE_IN_HI),
        hold: rand(HOLD_LO, HOLD_HI),
        fadeOut: rand(FADE_OUT_LO, FADE_OUT_HI),
        cool: rand(COOL_LO, COOL_HI),
        complexity: t.complexity,
      };
    });

    /* --- Starter 1: place a complex tile somewhat centrally --- */
    const cIdx = tiles.findIndex((t) => t.complexity === "complex");
    if (cIdx >= 0) {
      const p = arr[cIdx];
      p.x = ox + (vw - p.pw) / 2 + rand(-120, 120);
      p.y = oy + (vh - p.ph) / 2 + rand(-60, 60);
      p.x = Math.max(BUFFER, Math.min(aw - p.pw - BUFFER, p.x));
      p.y = Math.max(BUFFER, Math.min(ah - p.ph - BUFFER, p.y));
      p.state = FADING_IN;
      p.stateT = now;
      p.fadeIn = 2000;        // quick initial appearance
    }

    /* --- Starter 2: nearest tile to viewport centre --- */
    const vcx = ox + vw / 2;
    const vcy = oy + vh / 2;
    let s2 = -1, best = Infinity;
    for (let i = 0; i < arr.length; i++) {
      if (i === cIdx) continue;
      const dx = arr[i].x + arr[i].pw / 2 - vcx;
      const dy = arr[i].y + arr[i].ph / 2 - vcy;
      const d = dx * dx + dy * dy;
      if (d < best) { best = d; s2 = i; }
    }
    if (s2 >= 0) {
      const p = arr[s2];
      // nudge into viewport if not already
      if (!inViewport(p, ox, oy, vw, vh, 200)) {
        p.x = ox + rand(100, vw - p.pw - 100);
        p.y = oy + rand(100, vh - p.ph - 100);
        p.x = Math.max(BUFFER, Math.min(aw - p.pw - BUFFER, p.x));
        p.y = Math.max(BUFFER, Math.min(ah - p.ph - BUFFER, p.y));
      }
      p.state = FADING_IN;
      p.stateT = now;
      p.fadeIn = 3500;        // slightly slower than first
    }

    ps.current = arr;
  }, [sizes]);

  /* ── Animation loop ────────────────────────────────────── */
  const loop = useCallback((ts: number) => {
    if (!prevT.current) prevT.current = ts;
    const dt = Math.min((ts - prevT.current) / 16.667, 3);   // normalised to 60 fps
    prevT.current = ts;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const aw = vw * ARENA_MULT;
    const ah = vh * ARENA_MULT;
    const ox = (aw - vw) / 2;
    const oy = (ah - vh) / 2;
    const arr = ps.current;
    const n = arr.length;

    /* 1 — advance every tile's state machine */
    for (let i = 0; i < n; i++) tick(arr[i], ts);

    /* 2 — move */
    for (let i = 0; i < n; i++) {
      arr[i].x += arr[i].vx * dt;
      arr[i].y += arr[i].vy * dt;
    }

    /* 3 — arena walls */
    for (let i = 0; i < n; i++) {
      const p = arr[i];
      if (p.x < BUFFER) { p.x = BUFFER; p.vx = Math.abs(p.vx); }
      if (p.y < BUFFER) { p.y = BUFFER; p.vy = Math.abs(p.vy); }
      if (p.x + p.pw > aw - BUFFER) { p.x = aw - BUFFER - p.pw; p.vx = -Math.abs(p.vx); }
      if (p.y + p.ph > ah - BUFFER) { p.y = ah - BUFFER - p.ph; p.vy = -Math.abs(p.vy); }
    }

    /* 4 — tile-to-tile collision (AABB + buffer) */
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = arr[i], b = arr[j];
        const o1 = a.x + a.pw + BUFFER - b.x;
        const o2 = b.x + b.pw + BUFFER - a.x;
        const o3 = a.y + a.ph + BUFFER - b.y;
        const o4 = b.y + b.ph + BUFFER - a.y;

        if (o1 > 0 && o2 > 0 && o3 > 0 && o4 > 0) {
          const pens = [o1, o2, o3, o4];
          const min = Math.min(o1, o2, o3, o4);
          const ax = pens.indexOf(min);
          const push = min / 2 + 1;

          if (ax === 0)      { a.x -= push; b.x += push; a.vx = -Math.abs(a.vx); b.vx =  Math.abs(b.vx); }
          else if (ax === 1) { b.x -= push; a.x += push; b.vx = -Math.abs(b.vx); a.vx =  Math.abs(a.vx); }
          else if (ax === 2) { a.y -= push; b.y += push; a.vy = -Math.abs(a.vy); b.vy =  Math.abs(b.vy); }
          else               { b.y -= push; a.y += push; b.vy = -Math.abs(b.vy); a.vy =  Math.abs(a.vy); }
        }
      }
    }

    /* 5 — re-clamp */
    for (let i = 0; i < n; i++) {
      const p = arr[i];
      p.x = Math.max(BUFFER, Math.min(aw - BUFFER - p.pw, p.x));
      p.y = Math.max(BUFFER, Math.min(ah - BUFFER - p.ph, p.y));
    }

    /* 6 — director: keep ≥ 2 tiles visible in viewport */
    let vis = 0;
    for (let i = 0; i < n; i++) {
      const p = arr[i];
      if ((p.state === FADING_IN || p.state === VISIBLE) &&
          inViewport(p, ox, oy, vw, vh, 0)) {
        vis++;
      }
    }

    if (vis < MIN_VISIBLE) {
      // find the best HIDDEN tile near the viewport
      let pick = -1, score = -Infinity;
      for (let i = 0; i < n; i++) {
        const p = arr[i];
        if (p.state !== HIDDEN) continue;
        if (!inViewport(p, ox, oy, vw, vh, VP_MARGIN)) continue;
        const cx = p.x + p.pw / 2 - ox - vw / 2;
        const cy = p.y + p.ph / 2 - oy - vh / 2;
        let s = -(cx * cx + cy * cy);          // closer = better
        if (p.complexity === "complex") s += 40000;  // mild preference
        if (s > score) { score = s; pick = i; }
      }

      // nothing nearby → summon any HIDDEN tile to a viewport edge
      if (pick < 0) {
        for (let i = 0; i < n; i++) {
          if (arr[i].state === HIDDEN) { pick = i; break; }
        }
        if (pick >= 0) {
          const p = arr[pick];
          const edge = Math.floor(Math.random() * 4);
          if (edge === 0) {                                       // top
            p.x = ox + rand(0, vw - p.pw);
            p.y = oy - p.ph - rand(50, 200);
            p.vy = Math.abs(p.vy) || SPEED;
          } else if (edge === 1) {                                // right
            p.x = ox + vw + rand(50, 200);
            p.y = oy + rand(0, vh - p.ph);
            p.vx = -(Math.abs(p.vx) || SPEED);
          } else if (edge === 2) {                                // bottom
            p.x = ox + rand(0, vw - p.pw);
            p.y = oy + vh + rand(50, 200);
            p.vy = -(Math.abs(p.vy) || SPEED);
          } else {                                                // left
            p.x = ox - p.pw - rand(50, 200);
            p.y = oy + rand(0, vh - p.ph);
            p.vx = Math.abs(p.vx) || SPEED;
          }
          p.x = Math.max(BUFFER, Math.min(aw - p.pw - BUFFER, p.x));
          p.y = Math.max(BUFFER, Math.min(ah - p.ph - BUFFER, p.y));
        }
      }

      // if we still couldn't find HIDDEN, grab oldest COOLDOWN tile
      if (pick < 0) {
        let oldest = Infinity;
        for (let i = 0; i < n; i++) {
          if (arr[i].state === COOLDOWN && arr[i].stateT < oldest) {
            oldest = arr[i].stateT; pick = i;
          }
        }
      }

      if (pick >= 0) {
        arr[pick].state = FADING_IN;
        arr[pick].stateT = ts;
      }
    }

    /* 7 — paint */
    for (let i = 0; i < n; i++) {
      const el = tileRefs.current[i];
      if (!el) continue;
      const p = arr[i];
      el.style.transform = `translate(${p.x - ox}px, ${p.y - oy}px)`;
      el.style.opacity = String(tileOpacity(p, ts));
    }

    raf.current = requestAnimationFrame(loop);
  }, []);

  /* ── Setup / teardown ──────────────────────────────────── */
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) {
      tileRefs.current.forEach((el) => { if (el) el.style.opacity = "0.25"; });
      return;
    }

    const now = performance.now();
    init(now);

    // commit initial pixel widths
    const sz = sizes();
    ps.current.forEach((p, i) => {
      const el = tileRefs.current[i];
      if (el) el.style.width = `${sz[i].pw}px`;
    });

    raf.current = requestAnimationFrame(loop);

    const onResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const aw = vw * ARENA_MULT;
      const ah = vh * ARENA_MULT;
      const sz = sizes();
      ps.current.forEach((p, i) => {
        p.pw = sz[i].pw;
        p.ph = sz[i].ph;
        p.x = Math.max(BUFFER, Math.min(aw - p.pw - BUFFER, p.x));
        p.y = Math.max(BUFFER, Math.min(ah - p.ph - BUFFER, p.y));
        const el = tileRefs.current[i];
        if (el) el.style.width = `${p.pw}px`;
      });
    };
    window.addEventListener("resize", onResize);

    const onMotion = (e: MediaQueryListEvent) => {
      if (e.matches) {
        cancelAnimationFrame(raf.current);
        tileRefs.current.forEach((el) => {
          if (el) el.style.opacity = "0.25";
        });
      } else {
        init(performance.now());
        prevT.current = 0;
        raf.current = requestAnimationFrame(loop);
      }
    };
    mql.addEventListener("change", onMotion);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", onResize);
      mql.removeEventListener("change", onMotion);
    };
  }, [init, loop, sizes]);

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 z-[1] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {tiles.map((tile, i) => (
        <div
          key={i}
          ref={(el) => { tileRefs.current[i] = el; }}
          className="absolute top-0 left-0 will-change-[transform,opacity]"
          style={{ width: `${sizeVwMap[tile.complexity]}vw`, opacity: 0 }}
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
