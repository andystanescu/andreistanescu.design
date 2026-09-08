"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./Hero.module.css";

/**
 * The lattice's own size is capped by both viewport width AND height (it's
 * square), so whether the legend fits beside it or wraps below depends on
 * width and height together — no single CSS breakpoint can capture that
 * reliably. This measures where the legend actually landed and toggles its
 * layout to match, instead of guessing.
 */
export function DiagramLayout({
  lattice,
  legend,
}: {
  lattice: ReactNode;
  legend: ReactNode;
}) {
  const latticeRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [stacked, setStacked] = useState(false);

  useEffect(() => {
    function check() {
      const latticeBox = latticeRef.current?.getBoundingClientRect();
      const legendBox = legendRef.current?.getBoundingClientRect();
      if (!latticeBox || !legendBox) return;
      // Side by side: the legend starts to the right of the lattice.
      // Wrapped: the legend starts at (or left of) the lattice's own edge,
      // i.e. it dropped to a new line instead.
      setStacked(legendBox.left < latticeBox.right - 1);
    }

    check();
    window.addEventListener("resize", check);

    const observed = [latticeRef.current, legendRef.current].filter(
      (el): el is HTMLDivElement => el !== null
    );
    const resizeObserver = new ResizeObserver(check);
    observed.forEach((el) => resizeObserver.observe(el));

    return () => {
      window.removeEventListener("resize", check);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={`${styles.diagram} ${stacked ? styles.diagramStacked : ""}`}>
      <div ref={latticeRef}>{lattice}</div>
      <div ref={legendRef} className={styles.legend}>
        {legend}
      </div>
    </div>
  );
}
