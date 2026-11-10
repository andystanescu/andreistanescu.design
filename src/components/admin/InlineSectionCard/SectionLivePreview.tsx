"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import styles from "./InlineSectionCard.module.css";
import heroStyles from "@/components/about/AboutHero/AboutHero.module.css";

export function SectionLivePreview({ sectionKey, page, preview, children }: { sectionKey: string; page: "homepage" | "about"; preview?: ReactNode; children: ReactNode }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const imageUrl = useRef<string | null>(null);
  useEffect(() => () => { if (imageUrl.current) URL.revokeObjectURL(imageUrl.current); }, []);

  function updatePreview(event: FormEvent<HTMLDivElement>) {
    if (!previewRef.current || !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
    const form = event.target.form;
    const heading = previewRef.current.querySelector<HTMLElement>(sectionKey === "hero" ? "h1" : "header h2");
    if (!form || !heading) return;
    if (page === "about" && sectionKey === "hero" && event.target instanceof HTMLInputElement && event.target.name === "about_hero_image" && event.target.files?.[0]) {
      const imageContainer = previewRef.current.querySelector<HTMLElement>(`.${heroStyles.personalMark}`);
      if (imageContainer) {
        if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
        imageUrl.current = URL.createObjectURL(event.target.files[0]);
        const image = document.createElement("img");
        image.className = heroStyles.personalPhoto;
        image.src = imageUrl.current;
        image.alt = "About image preview";
        imageContainer.replaceChildren(image);
      }
    }
    const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? "";
    if (event.target.name === "headline") {
      const parts = value("headline").split("#");
      heading.replaceChildren(...parts.map((part, index) => {
        if (index % 2 === 0 || index === parts.length - 1) return document.createTextNode(part);
        const span = document.createElement("span");
        span.style.color = "var(--accent-foundation)";
        span.textContent = part;
        return span;
      }));
    }
    const container = heading.parentElement;
    if (!container) return;
    if (event.target.name === "eyebrow" && sectionKey !== "services") {
      let eyebrow = container.querySelector<HTMLElement>(".label-eyebrow");
      if (!eyebrow && value("eyebrow")) {
        eyebrow = document.createElement("p");
        eyebrow.className = "label-eyebrow";
        container.insertBefore(eyebrow, heading);
      }
      if (eyebrow) { eyebrow.textContent = value("eyebrow"); eyebrow.hidden = !value("eyebrow"); }
    }
    if (event.target.name === "description" && (page === "about" || ["hero", "approach", "selected_impact"].includes(sectionKey))) {
      const className = sectionKey === "hero" || (page === "about" && sectionKey === "before_conscept") ? "body-large" : page === "about" ? "body-default" : "body-small";
      let description = container.querySelector<HTMLElement>(`p.${className}`);
      if (!description && value("description")) {
        description = document.createElement("p");
        description.className = className;
        heading.insertAdjacentElement("afterend", description);
      }
      if (description) { description.textContent = value("description"); description.hidden = !value("description"); }
    }
  }

  if (!preview) return <>{children}</>;
  return <div className={styles.liveEditor} onInput={updatePreview} onChange={(event) => { if (event.target instanceof HTMLInputElement && event.target.type === "file") updatePreview(event); }}>
    {children}
    <div className={styles.livePreview} aria-label="Live section preview">
      <p className={styles.previewLabel}>Live preview</p>
      <div ref={previewRef} className={styles.previewContent} onClick={(event) => { if ((event.target as Element).closest("a,button")) event.preventDefault(); }}>
        {preview}
      </div>
    </div>
  </div>;
}
