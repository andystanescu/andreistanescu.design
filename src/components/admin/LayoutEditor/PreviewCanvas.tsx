"use client";
import { useEffect, useState, type ReactNode } from "react";
import type { LayoutPage, LayoutSection } from "@/lib/layoutDraft";

export function PreviewCanvas({ page, initial, slots, hero, closing, navigation, footer }: {
  page: LayoutPage; initial: LayoutSection[]; slots: { key: string; content: ReactNode }[];
  hero: ReactNode; closing?: ReactNode; navigation: ReactNode; footer: ReactNode;
}) {
  const [draft, setDraft] = useState(initial);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== "layout-draft" || event.data.page !== page) return;
      const rows: unknown = event.data.sections;
      if (!Array.isArray(rows) || rows.length !== initial.length || rows.some((row) => !row || typeof row.key !== "string" || typeof row.visible !== "boolean" || !initial.some((section) => section.key === row.key)) || new Set(rows.map((row) => row.key)).size !== initial.length) return;
      setDraft(rows);
    };
    // The preview is for layout only: links/forms must not navigate or mutate content.
    const preventNavigation = (event: Event) => {
      if (event.type === "submit" || (event.target as Element).closest?.("a,button")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("message", receive);
    document.addEventListener("click", preventNavigation, true);
    document.addEventListener("submit", preventNavigation, true);
    window.parent.postMessage({ type: "layout-ready" }, window.location.origin);
    return () => { window.removeEventListener("message", receive); document.removeEventListener("click", preventNavigation, true); document.removeEventListener("submit", preventNavigation, true); };
  }, [page, initial]);
  return <>{navigation}{hero}<main>{draft.filter((section) => section.key !== "hero").map((section) => <div key={section.key} hidden={!section.visible} data-preview-section={section.key}>{slots.find((slot) => slot.key === section.key)?.content}</div>)}{closing}</main>{footer}</>;
}
