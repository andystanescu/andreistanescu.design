"use client";

import { useRef } from "react";
import { RelatedReadingList } from "@/components/RelatedReadingList/RelatedReadingList";
import type { ResolvedRelatedReading } from "@/lib/relatedReadings";

type TocItem = { id: string; text: string };

export function TableOfContents({ items, relatedReadings = [] }: { items: TocItem[]; relatedReadings?: ResolvedRelatedReading[] }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  return <details ref={detailsRef} className="mobileToc"><summary>On this page <span aria-hidden="true">⌄</span></summary>{items.length > 0 && <nav aria-label="On this page"><ul>{items.map((item) => <li key={item.id}><a href={`#${item.id}`} onClick={() => detailsRef.current?.removeAttribute("open")}>{item.text}</a></li>)}</ul></nav>}<RelatedReadingList items={relatedReadings} /></details>;
}
