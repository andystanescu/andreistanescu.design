"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ImageGallery.module.css";

export type GalleryImage = { src: string; alt?: string; caption?: string };

export function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lightboxDragging, setLightboxDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dragRef = useRef({ pointerId: -1, startX: 0, startY: 0, startScrollLeft: 0, moved: false });
  const lightboxDragRef = useRef({ pointerId: -1, startX: 0, startY: 0, moved: false });
  const suppressClickRef = useRef(false);
  const scrollEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = images.length;

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tileRefs.current[active]?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [active]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => lightboxRef.current?.querySelector<HTMLElement>('button[aria-label="Close gallery"]')?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") setActive((value) => (value - 1 + count) % count);
      if (event.key === "ArrowRight") setActive((value) => (value + 1) % count);
      if (event.key === "Tab" && lightboxRef.current) {
        const controls = Array.from(lightboxRef.current.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [count, lightboxOpen]);

  useEffect(() => () => {
    if (scrollEndRef.current) clearTimeout(scrollEndRef.current);
  }, []);

  if (!count) return null;
  const move = (direction: -1 | 1) => setActive((value) => (value + direction + count) % count);
  const current = images[active];

  const selectNearestImage = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageCenter = stage.getBoundingClientRect().left + stage.clientWidth / 2;
    let nearestIndex = active;
    let nearestDistance = Number.POSITIVE_INFINITY;
    tileRefs.current.forEach((tile, index) => {
      if (!tile) return;
      const bounds = tile.getBoundingClientRect();
      const distance = Math.abs(bounds.left + bounds.width / 2 - stageCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setActive(nearestIndex);
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage || dragRef.current.pointerId !== event.pointerId) return;
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    suppressClickRef.current = dragRef.current.moved;
    dragRef.current.pointerId = -1;
    setDragging(false);
    selectNearestImage();
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  };

  const finishLightboxDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const gesture = lightboxDragRef.current;
    if (gesture.pointerId !== event.pointerId) return;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    const distance = event.clientX - gesture.startX;
    if (gesture.moved && Math.abs(distance) >= 48) move(distance > 0 ? -1 : 1);
    lightboxDragRef.current.pointerId = -1;
    setLightboxDragging(false);
  };

  return (
    <div className={styles.gallery}>
      <div
        ref={stageRef}
        className={`${styles.stage} ${dragging ? styles.stageDragging : ""}`}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          const stage = stageRef.current;
          if (!stage) return;
          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startScrollLeft: stage.scrollLeft,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const stage = stageRef.current;
          if (!stage || dragRef.current.pointerId !== event.pointerId) return;
          const distance = event.clientX - dragRef.current.startX;
          const verticalDistance = event.clientY - dragRef.current.startY;
          const isHorizontalIntent = Math.abs(distance) > 8 && Math.abs(distance) > Math.abs(verticalDistance) * 1.25;
          if (isHorizontalIntent && !dragRef.current.moved) {
            dragRef.current.moved = true;
            stage.setPointerCapture(event.pointerId);
            setDragging(true);
          }
          if (dragRef.current.moved) stage.scrollLeft = dragRef.current.startScrollLeft - distance;
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onScroll={() => {
          if (dragging) return;
          if (scrollEndRef.current) clearTimeout(scrollEndRef.current);
          scrollEndRef.current = setTimeout(selectNearestImage, 100);
        }}
        aria-label="Image gallery. Drag horizontally to browse images."
        aria-roledescription="carousel"
      >
        {images.map((image, index) => (
          <button
            type="button"
            key={`${image.src}-${index}`}
            ref={(element) => { tileRefs.current[index] = element; }}
            className={`${styles.tile} ${index === active ? styles.tileActive : ""}`}
            onClick={() => {
              if (suppressClickRef.current) return;
              setActive(index);
              setLightboxOpen(true);
            }}
            aria-label={`Open image ${index + 1} of ${count}`}
            aria-current={index === active ? "true" : undefined}
          >
            {/* User-managed uploads are served by the application's upload route. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt={image.alt || ""} />
            {index === active && <span className={styles.expandIcon} aria-hidden="true">↗</span>}
          </button>
        ))}
      </div>
      {current.caption && <p className={styles.galleryCaption} aria-live="polite">{current.caption}</p>}
      {count > 1 && <div className={styles.controls}>
        <button type="button" onClick={() => move(-1)} aria-label="Previous image">‹</button>
        <span>{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span>
        <button type="button" onClick={() => move(1)} aria-label="Next image">›</button>
      </div>}
      {lightboxOpen && createPortal(
        <div ref={lightboxRef} className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Image gallery" onMouseDown={(event) => { if (event.target === event.currentTarget) setLightboxOpen(false); }}>
          <div className={styles.lightboxHeader}>
            <span>IMAGE GALLERY</span>
            <div><span>{String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</span><button type="button" onClick={() => setLightboxOpen(false)} aria-label="Close gallery">×</button></div>
          </div>
          <div className={styles.lightboxStage} onMouseDown={(event) => { if (event.target === event.currentTarget) setLightboxOpen(false); }}>
            {count > 1 && <button type="button" onClick={() => move(-1)} aria-label="Previous image">‹</button>}
            <div
              className={`${styles.containBox} ${lightboxDragging ? styles.containBoxDragging : ""}`}
              onPointerDown={(event) => {
                if (!event.isPrimary || event.button !== 0) return;
                lightboxDragRef.current = {
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startY: event.clientY,
                  moved: false,
                };
              }}
              onPointerMove={(event) => {
                const gesture = lightboxDragRef.current;
                if (gesture.pointerId !== event.pointerId) return;
                const horizontalDistance = event.clientX - gesture.startX;
                const verticalDistance = event.clientY - gesture.startY;
                const isHorizontalIntent = Math.abs(horizontalDistance) > 8 && Math.abs(horizontalDistance) > Math.abs(verticalDistance) * 1.25;
                if (isHorizontalIntent && !gesture.moved) {
                  gesture.moved = true;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setLightboxDragging(true);
                }
              }}
              onPointerUp={finishLightboxDrag}
              onPointerCancel={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                lightboxDragRef.current.pointerId = -1;
                setLightboxDragging(false);
              }}
            >
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
