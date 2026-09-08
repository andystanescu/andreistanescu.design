"use client";

type TocItem = { id: string; text: string };

export function TableOfContents({ items }: { items: TocItem[] }) {
  return <details className="mobileToc"><summary>On this page <span aria-hidden="true">⌄</span></summary><nav aria-label="On this page"><ul>{items.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.text}</a></li>)}</ul></nav></details>;
}
