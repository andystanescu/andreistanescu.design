"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ImageGallery.module.css";

export type GalleryImage = { src: string; alt?: string; caption?: string };

export function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const count = images.length;

  useEffect(() => {
    tileRefs.current[active]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") setActive((value) => (value - 1 + count) % count);
      if (event.key === "ArrowRight") setActive((value) => (value + 1) % count);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [count, lightboxOpen]);

  if (!count) return null;
  const move = (direction: -1 | 1) => setActive((value) => (value + direction + count) % count);
  const current = images[active];

  return (
    <div className={styles.gallery}>
      <div className={styles.stage}>
        {images.map((image, index) => (
          <button
            type="button"
            key={`${image.src}-${index}`}
            ref={(element) => { tileRefs.current[index] = element; }}
            className={`${styles.tile} ${index === active ? styles.tileActive : ""}`}
            onClick={() => { setActive(index); setLightboxOpen(true); }}
            aria-label={`Open image ${index + 1} of ${count}`}
          >
            {/* User-managed uploads are served by the application's upload route. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt={image.alt || ""} />
            {index === active && <span className={styles.expandIcon} aria-hidden="true">↗</span>}
          </button>
        ))}
      </div>
      {count > 1 && <div className={styles.controls}>
        <button type="button" onClick={() => move(-1)} aria-label="Previous image">‹</button>
        <span>{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
        <button type="button" onClick={() => move(1)} aria-label="Next image">›</button>
      </div>}
      {lightboxOpen && createPortal(
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Image gallery" onMouseDown={(event) => { if (event.target === event.currentTarget) setLightboxOpen(false); }}>
          <div className={styles.lightboxHeader}>
            <span>IMAGE GALLERY</span>
            <div><span>{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span><button type="button" onClick={() => setLightboxOpen(false)} aria-label="Close gallery">×</button></div>
          </div>
          <div className={styles.lightboxStage} onMouseDown={(event) => { if (event.target === event.currentTarget) setLightboxOpen(false); }}>
            {count > 1 && <button type="button" onClick={() => move(-1)} aria-label="Previous image">‹</button>}
            <div className={styles.containBox} onMouseDown={(event) => { if (event.target === event.currentTarget) setLightboxOpen(false); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.src} alt={current.alt || ""} />
            </div>
            {count > 1 && <button type="button" onClick={() => move(1)} aria-label="Next image">›</button>}
          </div>
          <div className={styles.lightboxFooter}>
            <div>{current.caption && <p>{current.caption}</p>}{current.alt && <span>{current.alt}</span>}</div>
            <span>← → navigate &nbsp;&nbsp; esc close</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
