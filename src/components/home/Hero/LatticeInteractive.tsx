"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./LatticeDiagram.module.css";

type Particle = {
  el: SVGGraphicsElement;
  baseX: number;
  baseY: number;
  phaseX: number;
  phaseY: number;
  freqX: number;
  freqY: number;
  ampX: number;
  ampY: number;
  curX: number;
  curY: number;
  aX: number;
  aY: number;
  jumpX: number;
  jumpY: number;
  nextJumpAt: number;
  cX: number;
  cY: number;
};

type EdgeVertex = { particle: Particle } | { x: number; y: number };

type Edge = {
  el: SVGPathElement;
  vertices: EdgeVertex[];
  closed: boolean;
};

// All distances in the SVG's own 365x365 viewBox units, independent of
// rendered size.
const INFLUENCE_RADIUS = 60;
const MAX_PUSH = 22;
const SPRING = 0.07;
// How close an edge endpoint must be to a dot's center to count as attached
// to it, rather than being treated as a fixed point (accounts for the tiny
// sub-pixel imprecision of bezier-approximated circles).
const SNAP_EPSILON = 2;
// Much more forgiving than SNAP_EPSILON — that one matches an edge endpoint
// to the dot it's mathematically glued to; this is "did the user's cursor
// land close enough to a dot to grab it" and needs real hit-test room.
const GRAB_RADIUS = 16;
const DRAG_SPRING = 0.35;
const A_PULSE_DURATION = 1.9;
const A_PULSE_RADIUS = 185;

function parsePathVertices(d: string) {
  const tokens = d.match(/[MLHVZ][^MLHVZ]*/gi) ?? [];
  let curX = 0;
  let curY = 0;
  let startX = 0;
  let startY = 0;
  const points: { x: number; y: number }[] = [];
  let closed = false;

  for (const tok of tokens) {
    const cmd = tok[0].toUpperCase();
    const nums = tok
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);

    if (cmd === "M") {
      [curX, curY] = nums;
      startX = curX;
      startY = curY;
      points.push({ x: curX, y: curY });
    } else if (cmd === "L") {
      [curX, curY] = nums;
      points.push({ x: curX, y: curY });
    } else if (cmd === "H") {
      curX = nums[0];
      points.push({ x: curX, y: curY });
    } else if (cmd === "V") {
      curY = nums[0];
      points.push({ x: curX, y: curY });
    } else if (cmd === "Z") {
      closed = true;
      curX = startX;
      curY = startY;
    }
  }

  return { points, closed };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function animationTime() {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();
}

function getElementCenter(el: SVGGraphicsElement) {
  // getBBox() is the most accurate option, but it is not implemented by a
  // few embedded browser previews. The lattice dots are symmetric SVG paths,
  // so averaging their coordinate pairs gives the same center as a fallback.
  if (typeof el.getBBox === "function") {
    const box = el.getBBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  const values = (el.getAttribute("d")?.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
  if (values.length >= 2) {
    let x = 0;
    let y = 0;
    let pairs = 0;
    for (let i = 0; i < values.length - 1; i += 2) {
      x += values[i];
      y += values[i + 1];
      pairs += 1;
    }
    return { x: x / pairs, y: y / pairs };
  }

  return { x: 0, y: 0 };
}

function sampleLine(
  from: { x: number; y: number },
  to: { x: number; y: number },
  count: number
) {
  return Array.from({ length: count }, (_, index) => {
    const t = count <= 1 ? 0 : index / (count - 1);
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
  });
}

export function LatticeInteractive({ children, mode = "drift" }: { children: ReactNode; mode?: "drift" | "jumpy" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    const svg = container.querySelector("svg");
    if (!svg) return;

    // Nodes carry a `fill` (dots); edges carry only `stroke` — that split is
    // enough to tell them apart without needing ids on every path.
    const dotEls = Array.from(
      svg.querySelectorAll<SVGGraphicsElement>("path[fill]")
    );
    const edgeEls = Array.from(
      svg.querySelectorAll<SVGPathElement>("path[stroke]:not([fill])")
    );

    const particles: Particle[] = dotEls.map((el) => {
      const center = getElementCenter(el);
      return {
        el,
        baseX: center.x,
        baseY: center.y,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        freqX: 0.05 + Math.random() * 0.08,
        freqY: 0.05 + Math.random() * 0.08,
        ampX: 10 + Math.random() * 18,
        ampY: 10 + Math.random() * 18,
        curX: 0,
        curY: 0,
        aX: 0,
        aY: 0,
        jumpX: 0,
        jumpY: 0,
        nextJumpAt: 0,
        cX: 0,
        cY: 0,
      };
    });

    // A broad, rounded A keeps the temporary rearrangement legible at both
    // desktop and mobile sizes. The particles are distributed across the two
    // legs and crossbar so the same animation works with any SVG dot count.
    const legCount = Math.max(2, Math.round(particles.length * 0.42));
    const crossbarCount = Math.max(2, particles.length - legCount * 2);
    const aFormation = [
      ...sampleLine({ x: 68, y: 292 }, { x: 182, y: 68 }, legCount),
      ...sampleLine({ x: 118, y: 205 }, { x: 246, y: 205 }, crossbarCount),
      ...sampleLine({ x: 182, y: 68 }, { x: 296, y: 292 }, legCount),
    ];
    while (aFormation.length < particles.length) {
      aFormation.push({ x: 182, y: 68 });
    }
    aFormation.length = particles.length;
    const cTopCount = Math.max(2, Math.round(particles.length * 0.34));
    const cSideTotal = Math.max(4, Math.round(particles.length * 0.32));
    const cUpperSideCount = Math.max(2, Math.floor(cSideTotal / 2));
    const cLowerSideCount = Math.max(2, cSideTotal - cUpperSideCount);
    const cBottomCount = Math.max(2, particles.length - cTopCount - cSideTotal);
    const cFormation = [
      ...sampleLine({ x: 286, y: 74 }, { x: 104, y: 74 }, cTopCount),
      ...sampleLine({ x: 104, y: 74 }, { x: 72, y: 182 }, cUpperSideCount),
      ...sampleLine({ x: 72, y: 182 }, { x: 104, y: 290 }, cLowerSideCount),
      ...sampleLine({ x: 104, y: 290 }, { x: 286, y: 290 }, cBottomCount),
    ];
    while (cFormation.length < particles.length) {
      cFormation.push({ x: 104, y: 182 });
    }
    cFormation.length = particles.length;
    particles.forEach((particle, index) => {
      particle.aX = aFormation[index].x;
      particle.aY = aFormation[index].y;
      particle.cX = cFormation[index].x;
      particle.cY = cFormation[index].y;
    });

    function findNearestParticle(x: number, y: number) {
      let best: Particle | null = null;
      let bestDist = Infinity;
      // A few grid positions (e.g. the foundation corners) have both a
      // latent grid dot and a foundation/system dot sitting exactly on top
      // of it. `<=` — not `<` — lets a later match win an exact tie, so this
      // resolves to whichever dot is painted last (topmost, i.e. the one
      // actually visible there), not just whichever happens to come first.
      for (const p of particles) {
        const dist = Math.hypot(p.baseX - x, p.baseY - y);
        if (dist <= bestDist) {
          bestDist = dist;
          best = p;
        }
      }
      return bestDist <= SNAP_EPSILON ? best : null;
    }

    // Hit-test for grabbing a dot to drag — checks against each particle's
    // current (drifted) position, not its resting baseX/baseY, so a dot
    // that's mid-drift is still grabbable wherever it visually is.
    function findGrabbableParticle(x: number, y: number) {
      let best: Particle | null = null;
      let bestDist = GRAB_RADIUS;
      for (const p of particles) {
        const dist = Math.hypot(p.baseX + p.curX - x, p.baseY + p.curY - y);
        if (dist <= bestDist) {
          bestDist = dist;
          best = p;
        }
      }
      return best;
    }

    // Edges carry no connectivity data of their own, so each endpoint is
    // matched to whichever dot sits exactly there — that's what lets the
    // edge track the dot's live position every frame instead of staying put.
    const edges: Edge[] = edgeEls.map((el) => {
      const { points, closed } = parsePathVertices(el.getAttribute("d") ?? "");
      const vertices: EdgeVertex[] = points.map((pt) => {
        const particle = findNearestParticle(pt.x, pt.y);
        return particle ? { particle } : pt;
      });
      return { el, vertices, closed };
    });

    let mouseX = -9999;
    let mouseY = -9999;
    let rafId = 0;
    const requestFrame = (callback: FrameRequestCallback) =>
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame(callback)
        : window.setTimeout(() => callback(animationTime()), 16);
    const cancelFrame = (id: number) => {
      if (typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(id);
      } else {
        window.clearTimeout(id);
      }
    };
    const start = animationTime();
    let draggedParticle: Particle | null = null;
    let pendingParticle: Particle | null = null;
    let pendingPointerId: number | null = null;
    let pendingStartX = 0;
    let pendingStartY = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let maxDragDistance = 0;
    let aPulseStartedAt = -Infinity;
    let aPulseStrength = 0;
    let activeFormation: "A" | "C" = "A";

    function toSvgPoint(clientX: number, clientY: number) {
      const rect = svg!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * 365,
        y: ((clientY - rect.top) / rect.height) * 365,
      };
    }

    function handlePointerMove(e: PointerEvent) {
      if (pendingParticle && pendingPointerId === e.pointerId) {
        const deltaX = e.clientX - pendingStartX;
        const deltaY = e.clientY - pendingStartY;
        // On touch, let the browser own vertical gestures. Only turn the
        // gesture into a lattice drag once it is clearly horizontal.
        if (Math.hypot(deltaX, deltaY) < 8) return;
        if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          pendingParticle = null;
          pendingPointerId = null;
          mouseX = -9999;
          mouseY = -9999;
          return;
        }
        draggedParticle = pendingParticle;
        pendingParticle = null;
        pendingPointerId = null;
        dragStartX = draggedParticle.baseX + draggedParticle.curX;
        dragStartY = draggedParticle.baseY + draggedParticle.curY;
        maxDragDistance = 0;
        container!.setPointerCapture(e.pointerId);
        container!.classList.add(styles.grabbing);
        e.preventDefault();
      }
      const point = toSvgPoint(e.clientX, e.clientY);
      if (!point) return;
      mouseX = point.x;
      mouseY = point.y;
    }

    function handlePointerLeave() {
      if (draggedParticle) return; // keep tracking while a drag is in progress
      mouseX = -9999;
      mouseY = -9999;
    }

    function handlePointerDown(e: PointerEvent) {
      const point = toSvgPoint(e.clientX, e.clientY);
      if (!point) return;
      const grabbed = findGrabbableParticle(point.x, point.y);
      if (!grabbed) return;
      if (e.pointerType === "touch") {
        pendingParticle = grabbed;
        pendingPointerId = e.pointerId;
        pendingStartX = e.clientX;
        pendingStartY = e.clientY;
        return;
      }
      draggedParticle = grabbed;
      mouseX = point.x;
      mouseY = point.y;
      dragStartX = grabbed.baseX + grabbed.curX;
      dragStartY = grabbed.baseY + grabbed.curY;
      maxDragDistance = 0;
      container!.setPointerCapture(e.pointerId);
      container!.classList.add(styles.grabbing);
      e.preventDefault();
    }

    function releaseDrag(e: PointerEvent) {
      if (pendingPointerId === e.pointerId) {
        pendingParticle = null;
        pendingPointerId = null;
        mouseX = -9999;
        mouseY = -9999;
        return;
      }
      if (!draggedParticle) return;
      aPulseStrength = clamp(maxDragDistance / 120, 0.22, 1);
      aPulseStartedAt = animationTime();
      activeFormation = Math.random() < 0.5 ? "A" : "C";
      draggedParticle = null;
      mouseX = -9999;
      mouseY = -9999;
      container!.classList.remove(styles.grabbing);
      if (container!.hasPointerCapture(e.pointerId)) {
        container!.releasePointerCapture(e.pointerId);
      }
    }

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointerup", releaseDrag);
    container.addEventListener("pointercancel", releaseDrag);

    function tick(now: number) {
      const elapsed = (now - start) / 1000;
      const pulseAge = (now - aPulseStartedAt) / 1000;
      const pulseProgress = clamp(pulseAge / A_PULSE_DURATION, 0, 1);
      const pulseEnvelope = Math.sin(pulseProgress * Math.PI) * aPulseStrength;

      for (const p of particles) {
        if (p === draggedParticle) {
          // Follows the cursor directly (a snappier spring than the idle
          // drift) instead of the idle+push blend below — released, it
          // falls right back into that normal behavior on the next frame.
          const targetX = mouseX - p.baseX;
          const targetY = mouseY - p.baseY;
          maxDragDistance = Math.max(
            maxDragDistance,
            Math.hypot(mouseX - dragStartX, mouseY - dragStartY)
          );
          p.curX += (targetX - p.curX) * DRAG_SPRING;
          p.curY += (targetY - p.curY) * DRAG_SPRING;
          p.el.style.transform = `translate(${p.curX.toFixed(2)}px, ${p.curY.toFixed(2)}px)`;
          continue;
        }

        if (mode === "jumpy" && now >= p.nextJumpAt) {
          p.jumpX = Math.round((Math.random() - 0.5) * 52);
          p.jumpY = Math.round((Math.random() - 0.5) * 52);
          p.nextJumpAt = now + 90 + Math.random() * 260;
        }
        const idleX =
          mode === "jumpy"
            ? Math.sin(elapsed * p.freqX * Math.PI * 2 + p.phaseX) * p.ampX * 0.15 + p.jumpX
            : Math.sin(elapsed * p.freqX * Math.PI * 2 + p.phaseX) * p.ampX;
        const idleY =
          mode === "jumpy"
            ? Math.cos(elapsed * p.freqY * Math.PI * 2 + p.phaseY) * p.ampY * 0.15 + p.jumpY
            : Math.cos(elapsed * p.freqY * Math.PI * 2 + p.phaseY) * p.ampY;

        const dx = p.baseX - mouseX;
        const dy = p.baseY - mouseY;
        const dist = Math.hypot(dx, dy);

        let pushX = 0;
        let pushY = 0;
        if (dist < INFLUENCE_RADIUS && dist > 0.001) {
          const strength = (1 - dist / INFLUENCE_RADIUS) ** 2 * MAX_PUSH;
          pushX = (dx / dist) * strength;
          pushY = (dy / dist) * strength;
        }

        // Once released, the farther the grabbed dot travelled, the stronger
        // the temporary A formation. A distance-based delay makes the motion
        // read as a ripple moving through the lattice instead of a hard snap.
        let aX = 0;
        let aY = 0;
        if (pulseEnvelope > 0) {
          const rippleDistance = Math.hypot(p.baseX - (dragStartX || p.baseX), p.baseY - (dragStartY || p.baseY));
          const ripple = clamp(1 - rippleDistance / A_PULSE_RADIUS, 0, 1);
          const easedRipple = ripple * ripple * (3 - 2 * ripple);
          const targetX = activeFormation === "A" ? p.aX : p.cX;
          const targetY = activeFormation === "A" ? p.aY : p.cY;
          aX = (targetX - p.baseX) * pulseEnvelope * easedRipple;
          aY = (targetY - p.baseY) * pulseEnvelope * easedRipple;
        }

        p.curX += (idleX + pushX + aX - p.curX) * SPRING;
        p.curY += (idleY + pushY + aY - p.curY) * SPRING;

        p.el.style.transform = `translate(${p.curX.toFixed(2)}px, ${p.curY.toFixed(2)}px)`;
      }

      for (const edge of edges) {
        if (edge.vertices.length === 0) continue;
        let d = "";
        edge.vertices.forEach((v, i) => {
          const x = "particle" in v ? v.particle.baseX + v.particle.curX : v.x;
          const y = "particle" in v ? v.particle.baseY + v.particle.curY : v.y;
          d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
        });
        if (edge.closed) d += "Z";
        edge.el.setAttribute("d", d.trim());
      }

      rafId = requestFrame(tick);
    }

    rafId = requestFrame(tick);

    return () => {
      cancelFrame(rafId);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointerup", releaseDrag);
      container.removeEventListener("pointercancel", releaseDrag);
      for (const p of particles) {
        p.el.style.transform = "";
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.lattice}>
      {children}
    </div>
  );
}
