"use client";

import { useRef } from "react";

type TocItem = { id: string; text: string };

export function TableOfContents({ items }: { items: TocItem[] }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  return <details ref={detailsRef} className="mobileToc"><summary>On this page <span aria-hidden="true">⌄</span></summary><nav aria-label="On this page"><ul>{items.map((item) => <li key={item.id}><a href={`#${item.id}`} onClick={() => detailsRef.current?.removeAttribute("open")}>{item.text}</a></li>)}</ul></nav></details>;
}
