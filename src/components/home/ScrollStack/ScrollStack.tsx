"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function ScrollStack({ children, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-panel]"));
    const updatePanelFit = () => {
      const navHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 0;
      const availableHeight = Math.max(0, window.innerHeight - navHeight);

      panels.forEach((panel) => {
        const content = panel.firstElementChild;
        const contentHeight = content instanceof HTMLElement ? content.scrollHeight : panel.scrollHeight;
        const flowOnly = panel.dataset.scrollMode === "flow";
        panel.dataset.stackable = String(!flowOnly && contentHeight <= availableHeight + 1);
      });
    };

    let frame = 0;
    const updateStackProgress = () => {
      frame = 0;
      const navHeight = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 0;
      const pinTop = window.innerWidth > 900 ? navHeight : 0;
      const travel = Math.max(1, window.innerHeight - pinTop);

      panels.forEach((panel, index) => {
        const nextPanel = panels[index + 1];
        if (!nextPanel) {
          panel.style.setProperty("--scroll-push", "0");
          panel.style.setProperty("--scroll-fade", "1");
          return;
        }

        const nextTop = nextPanel.getBoundingClientRect().top;
        const progress = Math.min(1, Math.max(0, (window.innerHeight - nextTop) / travel));
        panel.style.setProperty("--scroll-push", progress.toFixed(3));
        panel.style.setProperty("--scroll-fade", Math.max(0, 1 - progress / 0.75).toFixed(3));
      });
    };
    const scheduleStackProgress = () => {
      if (!frame) frame = window.requestAnimationFrame(updateStackProgress);
    };
    const updateLayout = () => {
      updatePanelFit();
      scheduleStackProgress();
    };

    const observer = new ResizeObserver(updateLayout);
    panels.forEach((panel) => {
      observer.observe(panel);
      if (panel.firstElementChild instanceof HTMLElement) observer.observe(panel.firstElementChild);
    });
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", scheduleStackProgress, { passive: true });
    updatePanelFit();
    updateStackProgress();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", scheduleStackProgress);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={rootRef} className={className}>{children}</div>;
}
