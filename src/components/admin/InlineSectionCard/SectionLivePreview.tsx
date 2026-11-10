"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./InlineSectionCard.module.css";
import heroStyles from "@/components/about/AboutHero/AboutHero.module.css";

export function SectionLivePreview({ sectionKey, page, preview, children, photoInline = false }: { sectionKey: string; page: "homepage" | "about"; preview?: ReactNode; children: ReactNode; photoInline?: boolean }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const originalValue = useRef("");
  const [inlineReady, setInlineReady] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [photoTarget, setPhotoTarget] = useState<HTMLElement | null>(null);
  const imageUrl = useRef<string | null>(null);
  useEffect(() => () => { if (imageUrl.current) URL.revokeObjectURL(imageUrl.current); }, []);

  useEffect(() => {
    if (!previewRef.current) return;
    const root = previewRef.current;
    const heading = root.querySelector<HTMLElement>(sectionKey === "hero" ? "h1" : "header h2");
    if (!heading?.parentElement) return;
    const container = heading.parentElement;
    const mark = (node: HTMLElement, name: string, label: string) => {
      node.setAttribute("contenteditable", "plaintext-only");
      node.setAttribute("role", "textbox");
      node.setAttribute("aria-label", label);
      node.setAttribute("data-edit-field", name);
      node.setAttribute("data-placeholder", `Add ${label.toLowerCase()}`);
      node.setAttribute("tabindex", "0");
    };
    mark(heading, "headline", "Section headline");
    rootRef.current?.querySelector<HTMLInputElement>('form [name="headline"]')?.removeAttribute("required");
    if (page === "about" || sectionKey !== "services") {
      let eyebrow = container.querySelector<HTMLElement>(".label-eyebrow");
      if (!eyebrow) { eyebrow = document.createElement("p"); eyebrow.className = "label-eyebrow"; container.insertBefore(eyebrow, heading); }
      mark(eyebrow, "eyebrow", "Section eyebrow");
    }
    if (page === "about" || ["hero", "approach", "selected_impact"].includes(sectionKey)) {
      const descriptionClass = sectionKey === "hero" || (page === "about" && sectionKey === "before_conscept") ? "body-large" : page === "about" ? "body-default" : "body-small";
      let description = container.querySelector<HTMLElement>(`p.${descriptionClass}`);
      if (!description) { description = document.createElement("p"); description.className = descriptionClass; heading.insertAdjacentElement("afterend", description); }
      mark(description, "description", "Section description");
    }
    const markLinkLabel = (link: Element | null, name: string, label: string) => {
      if (!link) return;
      let text = link.querySelector<HTMLElement>(".label-button");
      if (!text) {
        const existing = Array.from(link.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
        if (!existing) return;
        text = document.createElement("span");
        existing.parentNode?.replaceChild(text, existing);
        text.appendChild(existing);
      }
      link.removeAttribute("href");
      link.setAttribute("role", "presentation");
      mark(text, name, label);
    };
    if (sectionKey === "hero") {
      const links = container.querySelectorAll("a");
      markLinkLabel(links[0] ?? null, page === "about" ? "cta_label" : "cta_primary_label", page === "about" ? "CV button label" : "Primary button label");
      if (page === "homepage") markLinkLabel(links[1] ?? null, "cta_secondary_label", "Secondary button label");
    } else if (sectionKey === "latest_insights") {
      markLinkLabel(container.querySelector("a"), page === "about" ? "cta_label" : "cta_primary_label", "Insights link label");
    }
    if (photoInline) {
      const target = root.querySelector<HTMLElement>(`.${heroStyles.personalMark}`);
      if (target) { target.classList.add(styles.photoTarget); setPhotoTarget(target); }
    }
    setInlineReady(true);
  }, [page, sectionKey, preview, photoInline]);

  function field(name: string) {
    return rootRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`form [name="${name}"]`) ?? null;
  }

  function renderHeading(node: HTMLElement, value: string) {
    const parts = value.split(/#([^#]+)#/g);
    node.replaceChildren(...parts.map((part, index) => {
      if (index % 2 === 0) return document.createTextNode(part);
      const span = document.createElement("span");
      span.style.color = page === "homepage" && sectionKey === "hero" ? "var(--accent-foundation)" : "var(--text-accent)";
      span.textContent = part;
      return span;
    }));
  }

  function updatePreview(event: FormEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLElement && event.target.hasAttribute("data-edit-field")) {
      const name = event.target.getAttribute("data-edit-field")!;
      const input = field(name);
      if (input) input.value = event.target.textContent ?? "";
      return;
    }
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
        const previous = imageContainer.querySelector(`.${heroStyles.personalPhoto}, .${heroStyles.personalLogoPlaceholder}`);
        if (previous) previous.replaceWith(image); else imageContainer.prepend(image);
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
  return <div ref={rootRef} className={styles.liveEditor} data-page={page} data-inline-ready={inlineReady || undefined} onInput={updatePreview} onSubmitCapture={(event) => {
    if (inlineReady && !field("headline")?.value.trim()) {
      event.preventDefault();
      setInlineError("Add a headline before saving this section.");
      previewRef.current?.querySelector<HTMLElement>('[data-edit-field="headline"]')?.focus();
    }
  }} onChange={(event) => { if (event.target instanceof HTMLInputElement && event.target.type === "file") updatePreview(event); }}>
    {children}
    <div className={styles.livePreview} aria-label="Live section preview">
      <p className={styles.previewLabel}>{inlineReady ? "Live preview · Select text to edit. In headings, wrap words in # to add an accent colour." : "Live preview"}</p>
      {inlineError && <p role="alert" className={styles.previewError}>{inlineError}</p>}
      <div ref={previewRef} className={styles.previewContent} onClick={(event) => { if ((event.target as Element).closest("a,button")) event.preventDefault(); }} onFocus={(event) => {
        const node = event.target;
        if (!(node instanceof HTMLElement) || !node.hasAttribute("data-edit-field")) return;
        const input = field(node.getAttribute("data-edit-field")!);
        originalValue.current = input?.value ?? "";
        if (node.getAttribute("data-edit-field") === "headline" && input?.value.includes("#")) node.textContent = input.value;
      }} onBlur={(event) => {
        const node = event.target;
        if (!(node instanceof HTMLElement) || !node.hasAttribute("data-edit-field")) return;
        const input = field(node.getAttribute("data-edit-field")!);
        if (input) input.value = node.textContent ?? "";
        if (node.getAttribute("data-edit-field") === "headline") renderHeading(node, input?.value ?? "");
      }} onKeyDown={(event) => {
        const node = event.target;
        if (!(node instanceof HTMLElement) || !node.hasAttribute("data-edit-field")) return;
        if (event.key === "Escape") { event.preventDefault(); node.textContent = originalValue.current; const input = field(node.getAttribute("data-edit-field")!); if (input) input.value = originalValue.current; node.blur(); }
        if (event.key === "Enter" && node.getAttribute("data-edit-field") !== "description") { event.preventDefault(); node.blur(); }
      }}>
        {preview}
        {photoTarget && createPortal(<label className={styles.photoUpload} title="Upload About photo"><input type="file" name="about_hero_image" form={`section-${page}-${sectionKey}`} accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" aria-label="Upload About photo" aria-describedby="about-photo-help" /><span className={styles.photoUploadIcon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg></span></label>, photoTarget)}
      </div>
      {photoTarget && <p id="about-photo-help" className={styles.previewLabel}>Select the photo to upload a JPEG, PNG, WebP, GIF or SVG, up to 8 MB.</p>}
    </div>
  </div>;
}
