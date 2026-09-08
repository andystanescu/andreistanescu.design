"use client";

import { useEffect, useRef, useState } from "react";
import type { LayoutPage, LayoutSection } from "@/lib/layoutDraft";
import styles from "./LayoutEditor.module.css";

export function LayoutEditor({ page, initial }: { page: LayoutPage; initial: { sections: LayoutSection[]; revision: string } }) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial.sections);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [device, setDevice] = useState(1440);
  const [availableWidth, setAvailableWidth] = useState(700);
  const [ready, setReady] = useState(false);
  const [dragged, setDragged] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved.sections);
  const scale = Math.min(1, availableWidth / device);
  const sendDraft = () => frame.current?.contentWindow?.postMessage({ type: "layout-draft", page, sections: draft }, window.location.origin);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => { if (entry.contentRect.width) setAvailableWidth(entry.contentRect.width); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === "layout-ready") setReady(true);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ type: "layout-draft", page, sections: draft }, window.location.origin);
  }, [draft, ready, page]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const intercept = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a[href]");
      if (link && !window.confirm("Discard your unsaved layout changes and leave?")) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", intercept, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", intercept, true); };
  }, [dirty]);

  function move(key: string, target: number) {
    setDraft((items) => {
      const source = items.findIndex((item) => item.key === key);
      if (source < 0 || target < 0 || target >= items.length || items[source].fixed || items[target].fixed) return items;
      const next = [...items];
      next.splice(target, 0, next.splice(source, 1)[0]);
      return next;
    });
    setMessage("");
  }
  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/layout/${page}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sections: draft, revision: saved.revision }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save the layout.");
      setSaved(result); setDraft(result.sections); setMessage("Layout saved to the website.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save the layout. Your draft is retained."); }
    finally { setSaving(false); }
  }
  return <section className={styles.editor} aria-label="Layout preview editor">
    <p>Drag sections or use the arrows. Changes appear in the preview and reach the website only when you save. Empty sections and sections for the other website mode may not render.</p>
    <div className={styles.actions}>
      <button type="button" className={styles.primary} disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save layout"}</button>
      <button type="button" disabled={!dirty || saving} onClick={() => { setDraft(saved.sections); setMessage("Draft discarded."); }}>Discard changes</button>
      <span role="status">{message || (dirty ? "Unsaved changes" : "Saved layout")}</span>
    </div>
    <div className={styles.workspace}>
      <fieldset className={styles.controls} disabled={saving}>
        <legend>Page sections</legend>
        <p className={styles.note}>Navigation · fixed</p>
        <ol>{draft.map((section, index) => <li key={section.key} draggable={!section.fixed && !saving} onDragStart={() => setDragged(section.key)} onDragEnd={() => setDragged(null)} onDragOver={(event) => { if (!section.fixed) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (dragged) move(dragged, index); setDragged(null); }}>
          <strong>{section.label}</strong>
          {section.fixed ? <span className={styles.note}>Fixed position</span> : <div className={styles.rowControls}>
            <label><input type="checkbox" role="switch" checked={section.visible} onChange={(event) => { setDraft(draft.map((item) => item.key === section.key ? { ...item, visible: event.target.checked } : item)); setMessage(""); }} /> Visible</label>
            <button type="button" disabled={index === 0 || draft[index - 1].fixed} aria-label={`Move ${section.label} up`} onClick={() => move(section.key, index - 1)}>↑</button>
            <button type="button" disabled={index === draft.length - 1 || draft[index + 1].fixed} aria-label={`Move ${section.label} down`} onClick={() => move(section.key, index + 1)}>↓</button>
          </div>}
        </li>)}</ol>
        {page === "about" && <p className={styles.note}>How I work · fixed closing section</p>}
        <p className={styles.note}>Footer · fixed</p>
      </fieldset>
      <div className={styles.preview}>
        <div className={styles.actions}><button type="button" aria-pressed={device === 1440} onClick={() => setDevice(1440)}>Desktop</button><button type="button" aria-pressed={device === 390} onClick={() => setDevice(390)}>Mobile</button><span>{device}px · {Math.round(scale * 100)}%</span></div>
        {!ready && <p role="status">Loading preview… If it does not load, check your admin session.</p>}
        <div ref={viewport} className={styles.viewport}>
          <div style={{ width: device * scale, height: 900 * scale, marginInline: "auto" }}>
            <iframe ref={frame} title={`${page === "homepage" ? "Homepage" : "About"} layout preview`} src={`/admin/layout-preview/${page}`} onLoad={sendDraft} style={{ width: device, height: 900, transform: `scale(${scale})`, transformOrigin: "top left" }} />
          </div>
        </div>
      </div>
    </div>
  </section>;
}
