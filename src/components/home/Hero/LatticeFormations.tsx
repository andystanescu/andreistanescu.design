"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./LatticeDiagram.module.css";

type Point = { x: number; y: number };
type Dot = { element: SVGGraphicsElement; base: Point; x: number; y: number };
type Edge = { element: SVGPathElement; original: string; vertices: Array<Dot | Point>; closed: boolean };

const shapes: Point[][][] = [
  // House, heart, star, arrow and lightbulb: deliberately simple silhouettes.
  [{x:55,y:170},{x:182,y:65},{x:310,y:170},{x:280,y:170},{x:280,y:290},{x:85,y:290},{x:85,y:170}],
  Array.from({length: 72}, (_, i) => { const t = i * Math.PI * 2 / 72; return {x:182 + 8.1 * 16 * Math.sin(t) ** 3, y:178 - 8.1 * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t))}; }),
  Array.from({length: 10}, (_, i) => { const angle = -Math.PI / 2 + i * Math.PI / 5; const radius = i % 2 ? 58 : 135; return {x:182 + Math.cos(angle)*radius, y:183 + Math.sin(angle)*radius}; }),
  [{x:48,y:145},{x:205,y:145},{x:205,y:80},{x:317,y:182},{x:205,y:284},{x:205,y:219},{x:48,y:219}],
  [{x:135,y:235},{x:130,y:214},{x:105,y:185},{x:95,y:153},{x:101,y:119},{x:120,y:91},{x:148,y:74},{x:182,y:68},{x:216,y:74},{x:244,y:91},{x:263,y:119},{x:269,y:153},{x:259,y:185},{x:234,y:214},{x:229,y:235},{x:221,y:245},{x:221,y:275},{x:207,y:287},{x:157,y:287},{x:143,y:275},{x:143,y:245}],
].map((outline) => [outline]);

const circle = (x: number, y: number, radius: number, count = 20): Point[] =>
  Array.from({length: count}, (_, i) => ({x: x + Math.cos(i * Math.PI * 2 / count) * radius, y: y + Math.sin(i * Math.PI * 2 / count) * radius}));

// Separate outlines allow the network nodes and the cog's centre to stay distinct.
const networkNodes = [{x:182,y:182}, {x:86,y:90}, {x:278,y:90}, {x:86,y:274}, {x:278,y:274}];
shapes.push([
  ...networkNodes.map(({x,y}) => circle(x,y,24)),
  ...networkNodes.slice(1).map((node) => [networkNodes[0], node]),
]);
const moonOuter = Array.from({length: 33}, (_, i) => { const angle = (-70 - 220 * i / 32) * Math.PI / 180; return {x:175 + 130 * Math.cos(angle), y:182 + 130 * Math.sin(angle)}; });
const moonStart = moonOuter[moonOuter.length - 1], moonEnd = moonOuter[0];
const moonInner = Array.from({length: 25}, (_, i) => { const t = i / 24; return {x:(1-t)**2*moonStart.x + 2*(1-t)*t*105 + t*t*moonEnd.x, y:(1-t)**2*moonStart.y + 2*(1-t)*t*182 + t*t*moonEnd.y}; });
shapes.push([[...moonOuter, ...moonInner]]);
shapes.push([
  Array.from({length: 32}, (_, i) => { const angle = -Math.PI / 2 + i * Math.PI / 16; const radius = i % 4 === 1 || i % 4 === 2 ? 135 : 108; return {x:182 + Math.cos(angle)*radius, y:182 + Math.sin(angle)*radius}; }),
  circle(182,182,48),
]);

function sampleOutline(points: Point[], count: number): Point[] {
  const lengths = points.map((point, i) => Math.hypot(points[(i + 1) % points.length].x - point.x, points[(i + 1) % points.length].y - point.y));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  return Array.from({length: count}, (_, i) => {
    let distance = total * i / count;
    let segment = 0;
    while (segment < lengths.length - 1 && distance > lengths[segment]) distance -= lengths[segment++];
    const from = points[segment], to = points[(segment + 1) % points.length];
    const t = lengths[segment] ? distance / lengths[segment] : 0;
    return {x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t};
  });
}

function vertices(path: string): { points: Point[]; closed: boolean } {
  let x = 0, y = 0;
  const points: Point[] = [];
  const tokens = path.match(/[MLHVZ][^MLHVZ]*/gi) ?? [];
  for (const token of tokens) {
    const command = token[0].toUpperCase();
    const values = token.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (command === "M" || command === "L") [x, y] = values;
    else if (command === "H") x = values[0];
    else if (command === "V") y = values[0];
    else continue;
    points.push({x, y});
  }
  return {points, closed: /z/i.test(path)};
}

export function LatticeFormations({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    const svg = container?.querySelector("svg");
    if (!container || !svg) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dots: Dot[] = Array.from(svg.querySelectorAll<SVGGraphicsElement>("path[fill]")).map((element) => {
      const box = element.getBBox();
      return {element, base: {x: box.x + box.width / 2, y: box.y + box.height / 2}, x: 0, y: 0};
    });
    if (!dots.length) return;
    const edges: Edge[] = Array.from(svg.querySelectorAll<SVGPathElement>("path[stroke]:not([fill])")).map((element) => {
      const original = element.getAttribute("d") ?? "";
      const parsed = vertices(original);
      return {element, original, closed: parsed.closed, vertices: parsed.points.map((point) => {
        let nearest: Dot | undefined;
        let distance = 2;
        for (const dot of dots) { const d = Math.hypot(dot.base.x - point.x, dot.base.y - point.y); if (d <= distance) { distance = d; nearest = dot; } }
        return nearest ?? point;
      })};
    });
    const formations = shapes.map((shape) => {
      const available = [...dots];
      // Keep a quarter of the dots independent of each silhouette.
      const totalCount = Math.ceil(dots.length * 0.75);
      const lengths = shape.map((path) => path.reduce((sum, point, i) => sum + Math.hypot(path[(i+1)%path.length].x-point.x,path[(i+1)%path.length].y-point.y),0));
      const totalLength = lengths.reduce((sum, length) => sum + length, 0);
      const allocations = lengths.map((length) => Math.floor(totalCount * length / totalLength));
      for (let i = 0, remaining = totalCount - allocations.reduce((sum, count) => sum + count, 0); i < remaining; i++) allocations[i % allocations.length]++;
      return shape.flatMap((path, pathIndex) => sampleOutline(path, allocations[pathIndex]).map((point, pointIndex) => ({point, startsPath: pointIndex === 0}))).map(({point, startsPath}) => {
        let closest = 0;
        for (let i = 1; i < available.length; i++) if (Math.hypot(available[i].base.x-point.x, available[i].base.y-point.y) < Math.hypot(available[closest].base.x-point.x, available[closest].base.y-point.y)) closest = i;
        return {dot: available.splice(closest, 1)[0], point, startsPath};
      });
    });
    const outline = document.createElementNS("http://www.w3.org/2000/svg", "path");
    outline.setAttribute("fill", "none");
    outline.setAttribute("stroke", "currentColor");
    outline.setAttribute("stroke-width", "1");
    outline.setAttribute("stroke-linejoin", "round");
    outline.style.pointerEvents = "none";
    svg.insertBefore(outline, svg.firstChild);
    const transitionDuration = 7000;
    const staggerDuration = 3800;
    const cycle = transitionDuration + 1000; // A full second once every dot is in position.
    const firstShape = Math.floor(Math.random() * formations.length);
    const targets = formations.map((formation) => new Map(formation.map(({dot, point}) => [dot, point])));
    const drift = new Map(dots.map((dot) => [dot, {phaseX: Math.random() * Math.PI * 2, phaseY: Math.random() * Math.PI * 2, speedX: 0.25 + Math.random() * 0.25, speedY: 0.25 + Math.random() * 0.25, amplitudeX: 12 + Math.random() * 12, amplitudeY: 12 + Math.random() * 12, stagger: Math.random()}]));
    let start = performance.now(), pausedAt = 0, frame = 0;
    let dragged: Dot | null = null, pointerId: number | null = null;
    let pending: {dot: Dot; id: number; x: number; y: number} | null = null;
    let restoring = false, snapshot: Point[] = [], dragPoint: Point | null = null;
    let recoilDot: Dot | null = null, velocityX = 0, velocityY = 0;
    let lastShape = firstShape, lastAmount = reduced ? 1 : 0;

    function render(shapeIndex: number, amount: number) {
      const formation = formations[shapeIndex];
      for (const dot of dots) dot.element.style.transform = `translate(${dot.x.toFixed(2)}px, ${dot.y.toFixed(2)}px)`;
      for (const edge of edges) {
        edge.element.style.opacity = String(1 - amount * 0.9);
        if (edge.vertices.length) edge.element.setAttribute("d", edge.vertices.map((vertex, i) => `${i ? "L" : "M"}${("base" in vertex ? vertex.base.x + vertex.x : vertex.x).toFixed(2)} ${("base" in vertex ? vertex.base.y + vertex.y : vertex.y).toFixed(2)}`).join(" ") + (edge.closed ? " Z" : ""));
      }
      outline.style.opacity = String(Math.max(0, (amount - 0.35) / 0.65) * 0.75);
      outline.setAttribute("d", formation.map(({dot, startsPath}, i) => `${startsPath ? (i ? "Z M" : "M") : "L"}${(dot.base.x + dot.x).toFixed(2)} ${(dot.base.y + dot.y).toFixed(2)}`).join(" ") + " Z");
    }
    function position(e: PointerEvent): Point | null {
      const box = svg!.getBoundingClientRect();
      return box.width && box.height ? {x:(e.clientX-box.left)*365/box.width,y:(e.clientY-box.top)*365/box.height} : null;
    }
    function beginDrag(dot: Dot, id: number, point: Point) {
      snapshot = dots.map((item) => ({x:item.x,y:item.y}));
      dragged = dot; pointerId = id; dragPoint = point; restoring = false; pausedAt = performance.now();
      container!.setPointerCapture(id); container!.classList.add(styles.grabbing);
      if (reduced && !frame) frame = requestAnimationFrame(tick);
    }
    function down(e: PointerEvent) {
      const point = position(e); if (!point) return;
      let nearest: Dot | null = null, distance = 16;
      for (const dot of dots) { const d = Math.hypot(dot.base.x + dot.x - point.x, dot.base.y + dot.y - point.y); if (d <= distance) { distance = d; nearest = dot; } }
      if (!nearest) return;
      if (e.pointerType === "touch") { pending = {dot:nearest,id:e.pointerId,x:e.clientX,y:e.clientY}; return; }
      beginDrag(nearest,e.pointerId,point); e.preventDefault();
    }
    function move(e: PointerEvent) {
      if (pending && pending.id === e.pointerId) {
        const dx = e.clientX-pending.x, dy = e.clientY-pending.y;
        if (Math.hypot(dx,dy) < 8) return;
        if (Math.abs(dy) >= Math.abs(dx)) { pending = null; return; }
        const point = position(e); if (!point) return;
        beginDrag(pending.dot,e.pointerId,point); pending = null; e.preventDefault();
      }
      if (dragged && pointerId === e.pointerId) dragPoint = position(e);
    }
    function release(e: PointerEvent) {
      if (pending?.id === e.pointerId) pending = null;
      if (!dragged || pointerId !== e.pointerId) return;
      recoilDot = dragged; dragged = null; pointerId = null; dragPoint = null;
      velocityX = 0; velocityY = 0;
      if (reduced) {
        dots.forEach((dot, i) => { dot.x = snapshot[i].x; dot.y = snapshot[i].y; });
        recoilDot = null; restoring = false; render(lastShape, lastAmount);
      } else restoring = true;
      container!.classList.remove(styles.grabbing);
      if (container!.hasPointerCapture(e.pointerId)) container!.releasePointerCapture(e.pointerId);
    }
    function tick(now: number) {
      frame = 0;
      if (dragged && dragPoint) {
        dragged.x += (dragPoint.x - dragged.base.x - dragged.x) * 0.35;
        dragged.y += (dragPoint.y - dragged.base.y - dragged.y) * 0.35;
      } else if (restoring) {
        const index = recoilDot ? dots.indexOf(recoilDot) : -1;
        if (recoilDot && index >= 0) {
          velocityX = (velocityX + (snapshot[index].x - recoilDot.x) * 0.16) * 0.76;
          velocityY = (velocityY + (snapshot[index].y - recoilDot.y) * 0.16) * 0.76;
          recoilDot.x += velocityX; recoilDot.y += velocityY;
        }
        if (!recoilDot || index < 0 || (Math.hypot(snapshot[index].x-recoilDot.x,snapshot[index].y-recoilDot.y) < 0.1 && Math.hypot(velocityX,velocityY) < 0.1)) {
          dots.forEach((dot,i) => {dot.x=snapshot[i].x;dot.y=snapshot[i].y;}); recoilDot = null; restoring = false; start += now-pausedAt;
        }
      } else if (!reduced) {
        const elapsed = Math.max(0,now-start), phase = elapsed % cycle;
        const iteration = Math.floor(elapsed / cycle);
        const nextShape = (firstShape + iteration) % formations.length;
        const previousShape = iteration ? (nextShape + formations.length - 1) % formations.length : null;
        // Fade each outline only while its dots are close enough to read as a shape.
        if (previousShape !== null && phase < 1000) {
          lastShape = previousShape;
          lastAmount = 1 - phase / 1000;
        } else {
          lastShape = nextShape;
          lastAmount = Math.min(1, Math.max(0, (phase - (transitionDuration - 1000)) / 1000));
        }
        for (const dot of dots) {
          const motion = drift.get(dot)!;
          const driftX = Math.sin(elapsed / 1000 * motion.speedX + motion.phaseX) * motion.amplitudeX;
          const driftY = Math.cos(elapsed / 1000 * motion.speedY + motion.phaseY) * motion.amplitudeY;
          const from = previousShape === null ? undefined : targets[previousShape].get(dot);
          const to = targets[nextShape].get(dot);
          const delay = ((motion.stagger + iteration * 0.381966) % 1) * staggerDuration;
          const raw = Math.min(1, Math.max(0, (phase - delay) / (transitionDuration - staggerDuration)));
          const progress = raw * raw * (3 - 2 * raw);
          const fromX = from ? from.x - dot.base.x : driftX;
          const fromY = from ? from.y - dot.base.y : driftY;
          const toX = to ? to.x - dot.base.x : driftX;
          const toY = to ? to.y - dot.base.y : driftY;
          dot.x = fromX + (toX - fromX) * progress;
          dot.y = fromY + (toY - fromY) * progress;
        }
      }
      render(lastShape,lastAmount);
      if (!reduced || dragged || restoring) frame = requestAnimationFrame(tick);
    }
    if (reduced) {
      for (const dot of dots) { const motion = drift.get(dot)!; dot.x = Math.sin(motion.phaseX) * motion.amplitudeX; dot.y = Math.cos(motion.phaseY) * motion.amplitudeY; }
      for (const {dot,point} of formations[firstShape]) { dot.x=point.x-dot.base.x; dot.y=point.y-dot.base.y; }
      render(firstShape,1);
    }
    else frame = requestAnimationFrame(tick);
    container.addEventListener("pointerdown",down); container.addEventListener("pointermove",move); container.addEventListener("pointerup",release); container.addEventListener("pointercancel",release);
    return () => {
      cancelAnimationFrame(frame); container.removeEventListener("pointerdown",down); container.removeEventListener("pointermove",move); container.removeEventListener("pointerup",release); container.removeEventListener("pointercancel",release);
      for (const dot of dots) dot.element.style.transform = "";
      for (const edge of edges) { edge.element.setAttribute("d",edge.original); edge.element.style.opacity = ""; }
      outline.remove(); container.classList.remove(styles.grabbing);
    };
  }, []);
  return <div ref={ref} className={styles.lattice}>{children}</div>;
}
