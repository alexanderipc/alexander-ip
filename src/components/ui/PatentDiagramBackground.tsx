"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";

/**
 * Patent diagram wraiths — ghostly diagrams that fade in fully inside
 * the viewport, drift slowly in one direction, and fade out before
 * they leave. A director keeps ≥ 3 on-screen at all times.
 *
 * Lifecycle: HIDDEN → FADING_IN → VISIBLE → FADING_OUT → COOLDOWN → …
 *
 * Rules:
 *  • Every tile is fully inside the viewport at peak opacity
 *  • Tiles never overlap (checked at spawn + per-frame guard)
 *  • Tiles never change direction (straight-line drift)
 *  • No duplicate images appear simultaneously
 *  • When a tile reaches the viewport edge it auto-fades out
 */

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
  complex: 57,
  medium: 37,
  simple: 27,
};

/* ── Tuning ────────────────────────────────────────────────── */
const SPEED = 0.12;         // px / frame @ 60 fps  (~7 px/sec)
const OP_PEAK_LO = 0.40;
const OP_PEAK_HI = 0.55;
const FADE_IN_LO = 3000;   const FADE_IN_HI = 5000;
const HOLD_LO = 16000;     const HOLD_HI = 30000;
const FADE_OUT_LO = 3000;  const FADE_OUT_HI = 5000;
const COOL_LO = 20000;     const COOL_HI = 40000;
const MIN_VISIBLE = 3;
const EDGE_MARGIN = 40;    // px inside viewport edge to start fade-out

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
  stateT: number;
  peak: number;
  fadeIn: number;
  hold: number;
  fadeOut: number;
  cool: number;
  complexity: Complexity;
}

/* ── Helpers ───────────────────────────────────────────────── */
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const ease = (t: number) => t * t * (3 - 2 * t);

function tileOpacity(p: Particle, now: number): number {
  const dt = now - p.stateT;
  if (p.state === FADING_IN)
    return ease(Math.max(0, Math.min(1, dt / p.fadeIn))) * p.peak;
  if (p.state === VISIBLE) return p.peak;
  if (p.state === FADING_OUT)
    return (1 - ease(Math.max(0, Math.min(1, dt / p.fadeOut)))) * p.peak;
  return 0;
}

function tick(p: Particle, now: number) {
  const dt = now - p.stateT;
  if (p.state === FADING_IN && dt >= p.fadeIn) {
    p.state = VISIBLE; p.stateT = now;
  } else if (p.state === VISIBLE && dt >= p.hold) {
    p.state = FADING_OUT; p.stateT = now;
  } else if (p.state === FADING_OUT && dt >= p.fadeOut) {
    p.state = COOLDOWN; p.stateT = now;
    p.peak = rand(OP_PEAK_LO, OP_PEAK_HI);
    p.fadeIn = rand(FADE_IN_LO, FADE_IN_HI);
    p.hold = rand(HOLD_LO, HOLD_HI);
    p.fadeOut = rand(FADE_OUT_LO, FADE_OUT_HI);
    p.cool = rand(COOL_LO, COOL_HI);
  } else if (p.state === COOLDOWN && dt >= p.cool) {
    p.state = HIDDEN; p.stateT = now;
  }
}

function isShowing(p: Particle) {
  return p.state === FADING_IN || p.state === VISIBLE;
}

function overlaps(a: Particle, b: Particle) {
  return a.x < b.x + b.pw && a.x + a.pw > b.x &&
         a.y < b.y + b.ph && a.y + a.ph > b.y;
}

/** Is every pixel of the tile inside the viewport? */
function fullyInside(p: Particle, vw: number, vh: number) {
  return p.x >= 0 && p.y >= 0 &&
         p.x + p.pw <= vw && p.y + p.ph <= vh;
}

/** Is the tile approaching a viewport edge? */
function nearEdge(p: Particle, vw: number, vh: number) {
  return p.x < EDGE_MARGIN || p.y < EDGE_MARGIN ||
         p.x + p.pw > vw - EDGE_MARGIN ||
         p.y + p.ph > vh - EDGE_MARGIN;
}

/**
 * Pick a random position fully inside the viewport.
 * For oversize tiles, centre on that axis.
 */
function randomInsideVP(p: Particle, vw: number, vh: number) {
  p.x = p.pw < vw ? rand(EDGE_MARGIN, vw - p.pw - EDGE_MARGIN) : (vw - p.pw) / 2;
  p.y = p.ph < vh ? rand(EDGE_MARGIN, vh - p.ph - EDGE_MARGIN) : (vh - p.ph) / 2;
}

/**
 * Try to place a tile inside the viewport without overlapping any
 * other showing tile. Returns true on success.
 */
function spawnInside(
  p: Particle, all: Particle[], vw: number, vh: number,
): boolean {
  for (let attempt = 0; attempt < 12; attempt++) {
    randomInsideVP(p, vw, vh);
    let ok = true;
    for (const o of all) {
      if (o === p || !isShowing(o)) continue;
      if (overlaps(p, o)) { ok = false; break; }
    }
    if (ok) {
      // give it a random drift direction
      const angle = rand(0, Math.PI * 2);
      const spd = SPEED * rand(0.7, 1.2);
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      return true;
    }
  }
  return false;
}

/* ── Component ─────────────────────────────────────────────── */

export default function PatentDiagramBackground() {
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ps = useRef<Particle[]>([]);
  const raf = useRef(0);
  const prevT = useRef(0);

  const sizes = useCallback(() => {
    const vw = window.innerWidth;
    return tiles.map((t) => {
      const pw = (sizeVwMap[t.complexity] / 100) * vw;
      return { pw, ph: pw * (t.h / t.w) };
    });
  }, []);

  /* ── Initialise ──────────────────────────────────────────── */
  const init = useCallback((now: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sz = sizes();

    const arr: Particle[] = tiles.map((t, i) => {
      const { pw, ph } = sz[i];
      return {
        x: -9999, y: -9999, vx: 0, vy: 0,
        pw, ph,
        state: HIDDEN as number,
        stateT: now,
        peak: rand(OP_PEAK_LO, OP_PEAK_HI),
        fadeIn: rand(FADE_IN_LO, FADE_IN_HI),
        hold: rand(HOLD_LO, HOLD_HI),
        fadeOut: rand(FADE_OUT_LO, FADE_OUT_HI),
        cool: rand(COOL_LO, COOL_HI),
        complexity: t.complexity,
      };
    });

    /* --- Starter 1: complex tile somewhat central --- */
    const cIdx = tiles.findIndex((t) => t.complexity === "complex");
    if (cIdx >= 0) {
      const p = arr[cIdx];
      p.x = (vw - p.pw) / 2 + rand(-80, 80);
      p.y = (vh - p.ph) / 2 + rand(-40, 40);
      // clamp inside
      if (p.pw < vw) p.x = Math.max(EDGE_MARGIN, Math.min(vw - p.pw - EDGE_MARGIN, p.x));
      else p.x = (vw - p.pw) / 2;
      if (p.ph < vh) p.y = Math.max(EDGE_MARGIN, Math.min(vh - p.ph - EDGE_MARGIN, p.y));
      else p.y = (vh - p.ph) / 2;
      const angle = rand(0, Math.PI * 2);
      const spd = SPEED * rand(0.7, 1.1);
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.state = FADING_IN;
      p.stateT = now;
      p.fadeIn = 2000;
    }

    /* --- Starters 2–3: two more placed without overlap --- */
    const delays = [1200, 2800];
    let placed = 0;
    for (let i = 0; i < arr.length && placed < delays.length; i++) {
      if (i === cIdx) continue;
      const p = arr[i];
      if (spawnInside(p, arr, vw, vh)) {
        p.state = FADING_IN;
        p.stateT = now + delays[placed];
        p.fadeIn = rand(3000, 4500);
        placed++;
      }
    }

    ps.current = arr;
  }, [sizes]);

  /* ── Animation loop ──────────────────────────────────────── */
  const loop = useCallback((ts: number) => {
    if (!prevT.current) prevT.current = ts;
    const dt = Math.min((ts - prevT.current) / 16.667, 3);
    prevT.current = ts;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const arr = ps.current;
    const n = arr.length;

    /* 1 — advance state machines */
    for (let i = 0; i < n; i++) tick(arr[i], ts);

    /* 2 — drift */
    for (let i = 0; i < n; i++) {
      arr[i].x += arr[i].vx * dt;
      arr[i].y += arr[i].vy * dt;
    }

    /* 3 — auto-fade: if a VISIBLE tile is about to leave the viewport,
           start fading it out so it disappears gracefully before the edge */
    for (let i = 0; i < n; i++) {
      const p = arr[i];
      if (p.state === VISIBLE && !fullyInside(p, vw, vh)) {
        p.state = FADING_OUT;
        p.stateT = ts;
      }
    }

    /* 4 — overlap guard: if two showing tiles overlap, fade out newer */
    for (let i = 0; i < n; i++) {
      if (!isShowing(arr[i])) continue;
      for (let j = i + 1; j < n; j++) {
        if (!isShowing(arr[j])) continue;
        if (overlaps(arr[i], arr[j])) {
          const victim = arr[i].stateT > arr[j].stateT ? arr[i] : arr[j];
          if (victim.state !== FADING_OUT) {
            victim.state = FADING_OUT;
            victim.stateT = ts;
          }
        }
      }
    }

    /* 5 — fast-track tiles that are fully off-screen to COOLDOWN */
    for (let i = 0; i < n; i++) {
      const p = arr[i];
      if (p.state === FADING_OUT) {
        const offX = p.x + p.pw < -100 || p.x > vw + 100;
        const offY = p.y + p.ph < -100 || p.y > vh + 100;
        if (offX || offY) {
          p.state = COOLDOWN; p.stateT = ts;
          p.cool = rand(COOL_LO, COOL_HI);
        }
      }
    }

    /* 6 — director: keep ≥ MIN_VISIBLE tiles showing */
    let vis = 0;
    for (let i = 0; i < n; i++) {
      if (isShowing(arr[i]) && fullyInside(arr[i], vw, vh)) vis++;
    }

    while (vis < MIN_VISIBLE) {
      const hidden: number[] = [];
      for (let i = 0; i < n; i++) {
        if (arr[i].state === HIDDEN) hidden.push(i);
      }
      if (hidden.length === 0) {
        // fallback: oldest cooldown
        let oldest = Infinity, pick = -1;
        for (let i = 0; i < n; i++) {
          if (arr[i].state === COOLDOWN && arr[i].stateT < oldest) {
            oldest = arr[i].stateT; pick = i;
          }
        }
        if (pick < 0) break;
        hidden.push(pick);
      }

      // shuffle and try each candidate
      let spawned = false;
      const shuffled = hidden.sort(() => Math.random() - 0.5);
      for (const idx of shuffled) {
        const p = arr[idx];
        if (spawnInside(p, arr, vw, vh)) {
          p.state = FADING_IN;
          p.stateT = ts;
          vis++;
          spawned = true;
          break;
        }
      }
      if (!spawned) break;
    }

    /* 7 — paint */
    for (let i = 0; i < n; i++) {
      const el = tileRefs.current[i];
      if (!el) continue;
      const p = arr[i];
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
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

    init(performance.now());

    const sz = sizes();
    ps.current.forEach((_, i) => {
      const el = tileRefs.current[i];
      if (el) el.style.width = `${sz[i].pw}px`;
    });

    raf.current = requestAnimationFrame(loop);

    const onResize = () => {
      const sz = sizes();
      ps.current.forEach((p, i) => {
        p.pw = sz[i].pw;
        p.ph = sz[i].ph;
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
