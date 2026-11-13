"use client";

import { useState, type ChangeEvent } from "react";
import { TRANSFER_GROUPS, type TransferKey } from "@/lib/contentTransfer";
import styles from "../admin.module.css";
import transfer from "./ContentTransfer.module.css";

type Selection = { content: TransferKey[]; images: TransferKey[] };
function Choices({ selection, setSelection }: { selection: Selection; setSelection: (selection: Selection) => void }) {
  function toggle(key: TransferKey, kind: "content" | "images", checked: boolean) {
    const next = { ...selection, [kind]: checked ? [...selection[kind], key] : selection[kind].filter((item) => item !== key) };
    if (kind === "content" && !checked) next.images = next.images.filter((item) => item !== key);
    setSelection(next);
  }
  return <fieldset className={transfer.choices}><legend className="body-default">Choose what to include</legend>{TRANSFER_GROUPS.map(({ key, label, description, images }) => <div className={`${transfer.group} ${selection.content.includes(key) ? transfer.selected : ""}`} key={key}>
    <label className={transfer.cardOption}><input type="checkbox" checked={selection.content.includes(key)} onChange={(event) => toggle(key, "content", event.target.checked)} /><span className={transfer.cardCopy}><span>{label}</span><span className={`body-small ${transfer.cardDescription}`}>{description}</span></span><span className={transfer.selectionIndicator} aria-hidden="true">✓</span></label>
    {images && selection.content.includes(key) && <label className={`${styles.checkboxField} ${transfer.imageToggle}`}><input type="checkbox" role="switch" aria-label={`Include images for ${label}`} checked={selection.images.includes(key)} onChange={(event) => toggle(key, "images", event.target.checked)} /><span className={styles.switch} aria-hidden="true" /><span>Include images</span></label>}
  </div>)}</fieldset>;
}

export default function ContentTransfer() {
  const [exportSelection, setExportSelection] = useState<Selection>({ content: [], images: [] });
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    setFile(null); setMessage("");
    if (!next) return;
    try {
      const payload = JSON.parse(await next.text()) as Record<string, unknown>;
      if (payload.format !== "conscept-content" || payload.version !== 1) throw new Error("Choose a compatible content export.");
      setFile(next);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not read this file."); }
  }

  async function exportContent() {
    setBusy(true); setMessage("");
    try {
      const params = new URLSearchParams({ content: exportSelection.content.join(","), images: exportSelection.images.join(",") });
      const response = await fetch(`/api/admin/content-export?${params}`);
      if (!response.ok) throw new Error("Export failed.");
      const blob = await response.blob();
      const suggestedName = `content-export-${new Date().toISOString().slice(0, 10)}.json`;
      const picker = (window as Window & { showSaveFilePicker?: (options?: unknown) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }> }).showSaveFilePicker;
      if (picker) {
        const handle = await picker({ suggestedName, types: [{ description: "JSON content export", accept: { "application/json": [".json"] } }] });
        const writable = await handle.createWritable(); await writable.write(blob); await writable.close();
      } else {
        const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = suggestedName; anchor.click(); URL.revokeObjectURL(url);
      }
      setMessage("Content export saved.");
    } catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage(error instanceof Error ? error.message : "Export failed."); }
    finally { setBusy(false); }
  }

  async function importContent() {
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/admin/content-import", { method: "POST", body: form });
      const text = await response.text();
      let result: { error?: string };
      try { result = JSON.parse(text); } catch { throw new Error(response.status === 413 ? "This export is too large to import. The server upload limit must be increased." : "The server returned an unreadable response."); }
      if (!response.ok) throw new Error(result.error ?? "Import failed.");
      setMessage("Content imported successfully.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Import failed."); }
    finally { setBusy(false); }
  }

  return <>
    <div className={`${styles.pageHeader} ${styles.pageHeaderStacked}`}><p className="label-eyebrow">CONTENT TRANSFER</p><h1 className="heading-01">Move your content</h1><p className={`body-small ${styles.helper}`}>Choose what to transfer, including images where needed. Importing updates matching content on this site.</p></div>
    <div className={transfer.layout}>
      <section className={transfer.panel} aria-labelledby="export-heading"><div><h2 id="export-heading" className="heading-02">Export content</h2><p className="body-small">Download the selected content as a JSON file.</p></div><Choices selection={exportSelection} setSelection={setExportSelection} /><button className={styles.submit} type="button" onClick={exportContent} disabled={busy || !exportSelection.content.length}>Export content</button></section>
      <section className={transfer.panel} aria-labelledby="import-heading"><div><h2 id="import-heading" className="heading-02">Import content</h2><p className="body-small">Import everything included in an export file. Matching content will be updated.</p></div><label className={transfer.fileLabel}>Choose export file<input type="file" accept="application/json,.json" onChange={chooseFile} /></label>{file && <p className="body-small">{file.name}</p>}<button className={styles.secondaryButton} type="button" onClick={importContent} disabled={busy || !file}>Import content</button></section>
    </div>{message && <p className={transfer.status} role="status">{message}</p>}
  </>;
}
