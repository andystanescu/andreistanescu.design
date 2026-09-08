"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
} from "react";
import styles from "./ReorderableList.module.css";

type ReorderableItem = {
  id: string;
  node: ReactNode;
};

type ReorderableListProps = {
  items: ReorderableItem[];
  reorderUrl: string;
  /** Class for the outer <ul>. */
  className?: string;
  /** Class for each <li> — pass the existing .listItem class; this
   * component owns the <li> itself, so `node` must be the row's INNER
   * content only (no wrapping <li>). */
  itemClassName?: string;
  style?: CSSProperties;
};

// Drag-and-drop reordering for admin lists. `items[].node` is the row's
// already-built markup (Edit link, Delete form, etc.) from the server —
// this component only adds a drag handle around it and POSTs the new
// order on drop. The move up/down button forms already on each row keep
// working as a no-JS-required fallback; this is additive, not a replacement.
//
// The dragged row is represented on screen by a styled clone that follows
// the cursor (via setDragImage) — the original slot becomes a light
// placeholder. Hovering another row moves it there immediately in local
// state, so the rows between the old and new spot visibly shift to open a
// gap (animated with a FLIP transform) rather than only reordering on drop.
export function ReorderableList({
  items: initialItems,
  reorderUrl,
  className,
  itemClassName,
  style,
}: ReorderableListProps) {
  const [items, setItems] = useState(initialItems);
  // dragId (state) drives the placeholder styling on re-render. dragIdRef
  // mirrors it for reads inside event handlers — dragstart's setDragId
  // doesn't commit until the next render, and a real drag can fire
  // dragover on the next row before that render happens, so a handler
  // that only closed over the state value would silently miss that first
  // dragover (read stale null) and never start the reorder.
  const [dragId, setDragId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const [, startTransition] = useTransition();
  const listRef = useRef<HTMLUListElement>(null);
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const dragImageRef = useRef<HTMLElement | null>(null);
  const orderRef = useRef(items);
  orderRef.current = items;

  function captureRects() {
    const map = new Map<string, DOMRect>();
    listRef.current?.querySelectorAll<HTMLElement>("[data-item-id]").forEach((el) => {
      map.set(el.dataset.itemId!, el.getBoundingClientRect());
    });
    prevRectsRef.current = map;
  }

  // FLIP: whenever the order changes, the browser has already laid rows
  // out in their new spots — jump each row back to where it WAS (via
  // transform) then animate that back to zero, so the shift reads as a
  // slide instead of an instant cut.
  useLayoutEffect(() => {
    const nodes = listRef.current?.querySelectorAll<HTMLElement>("[data-item-id]");
    nodes?.forEach((el) => {
      const id = el.dataset.itemId!;
      const prev = prevRectsRef.current.get(id);
      if (!prev) return;
      const next = el.getBoundingClientRect();
      const dy = prev.top - next.top;
      if (!dy) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.2s ease";
        el.style.transform = "";
      });
    });
  }, [items]);

  function moveDragged(overId: string) {
    const dragId = dragIdRef.current;
    if (!dragId || dragId === overId) return;
    const current = orderRef.current;
    const fromIndex = current.findIndex((i) => i.id === dragId);
    const toIndex = current.findIndex((i) => i.id === overId);
    if (fromIndex === -1 || toIndex === -1) return;

    captureRects();
    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
  }

  function handleDragStart(e: DragEvent<HTMLLIElement>, id: string) {
    dragIdRef.current = id;
    setDragId(id);

    const row = e.currentTarget;
    const rect = row.getBoundingClientRect();
    const clone = row.cloneNode(true) as HTMLElement;
    clone.classList.add(styles.dragImage);
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);
    dragImageRef.current = clone;

    const offsetX = e.nativeEvent.offsetX;
    const offsetY = e.nativeEvent.offsetY;
    e.dataTransfer.setDragImage(clone, offsetX, offsetY);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    dragIdRef.current = null;
    setDragId(null);
    dragImageRef.current?.remove();
    dragImageRef.current = null;
  }

  function handleDrop(e: DragEvent<HTMLLIElement>) {
    e.preventDefault();
    if (!dragIdRef.current) return;
    const finalOrder = orderRef.current;

    startTransition(() => {
      fetch(reorderUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: finalOrder.map((i) => i.id) }),
      });
    });
  }

  return (
    <ul ref={listRef} className={className} style={style}>
      {items.map((item) => (
        <li
          key={item.id}
          data-item-id={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => {
            e.preventDefault();
            moveDragged(item.id);
          }}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          className={`${itemClassName ?? ""} ${styles.draggableRow} ${
            dragId === item.id ? styles.dragging : ""
          }`}
        >
          <span className={styles.handle} aria-hidden="true" title="Drag to reorder">
            ⠿
          </span>
          {item.node}
        </li>
      ))}
    </ul>
  );
}
