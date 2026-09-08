"use client";

import { useRef, useState } from "react";
import styles from "../admin.module.css";

export default function ContentTransfer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");

  async function exportContent() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/content-export");
      if (!response.ok) throw new Error("Export failed.");
      const blob = await response.blob();
      const suggestedName = `conscept-content-${new Date().toISOString().slice(0, 10)}.json`;
      const picker = (window as Window & { showSaveFilePicker?: (options?: unknown) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }> }).showSaveFilePicker;
      if (picker) {
        const handle = await picker({ suggestedName, types: [{ description: "JSON content export", accept: { "application/json": [".json"] } }] });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = suggestedName;
        anchor.click();
        URL.revokeObjectURL(url);
      }
      setMessage("Content export saved.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  async function importContent() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setMessage("Choose a ConScept content export first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/content-import", { method: "POST", body: form });
      const result = (await response.json()) as { error?: string; imported?: { caseStudies: number; insights: number } };
      if (!response.ok) throw new Error(result.error ?? "Import failed.");
      setMessage(`Imported ${result.imported?.caseStudies ?? 0} case studies and ${result.imported?.insights ?? 0} insights.`);
      if (inputRef.current) inputRef.current.value = "";
      setFileName("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="label-eyebrow">CONTENT TRANSFER</p>
      <h1 className="heading-01">Move your content</h1>
      <p className={`body-small ${styles.helper}`} style={{ maxWidth: 680 }}>
        Export case studies and insights from this app, then import the JSON into another ConScept deployment. Existing records are matched by slug and updated; other admin data is left alone.
      </p>
      <div className={`${styles.transferPanel}`}>
        <div className={styles.transferActions}>
          <button className={styles.submit} type="button" onClick={exportContent} disabled={busy}>
            {busy ? "Working…" : "Export content"}
          </button>
          <button className={styles.secondaryButton} type="button" onClick={importContent} disabled={busy}>
            Import content
          </button>
        </div>
        <div className={styles.uploadRow}>
          <label className={styles.uploadButton} title="Choose content export file">
            <span aria-hidden="true" className={styles.uploadIcon}>↑</span>
            <span className={styles.srOnly}>Choose content export file</span>
            <input ref={inputRef} type="file" accept="application/json,.json" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
          </label>
          {fileName && <span className={styles.fileName}>{fileName}</span>}
        </div>
        {message && <p className="body-small" role="status">{message}</p>}
      </div>
    </>
  );
}
