"use client";

import * as React from "react";
import { LiveContext, LiveProvider, LivePreview, LiveError } from "react-live";
import styles from "./LiveComponentBlock.module.css";

type LiveComponentBlockProps = {
  code: string;
  chrome?: "framed" | "minimal";
};

type PreviewMode = "react" | "html" | "none";

// The available identifiers inside a "⚡ Live" code block — no bundler or
// import resolution runs here (react-live transpiles in the browser via
// Sucrase and evaluates the result directly), so anything the snippet
// wants to use has to be handed in through this scope explicitly.
const scope = {
  React,
  useState: React.useState,
  useEffect: React.useEffect,
  useRef: React.useRef,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
};

function prepareLiveCode(source: string): string {
  let code = source
    // Live blocks already receive React through the execution scope.
    .replace(/^\s*import[^;]+;\s*$/gm, "")
    // Inline evaluation cannot contain module exports.
    .replace(/export\s+default\s+function\s+/g, "function ")
    .replace(/export\s+default\s+/g, "");

  if (!/\brender\s*\(/.test(code)) {
    const component = code.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/)?.[1];
    if (component) code += `\nrender(<${component} />);`;
  }
  return code;
}

function detectPreviewMode(source: string): PreviewMode {
  const code = source.trim();
  if (!code) return "none";

  // React snippets take precedence because JSX also contains HTML-like tags.
  if (
    /\b(render|React|useState|useEffect|useMemo)\b/.test(code) ||
    /\bfunction\s+[A-Z][A-Za-z0-9_]*\s*\(/.test(code) ||
    /\b(?:const|let)\s+[A-Z][A-Za-z0-9_]*\s*=/.test(code) ||
    /return\s*\(\s*<[A-Za-z]/.test(code)
  ) {
    return "react";
  }

  // Markup fragments and complete HTML/SVG documents can render in isolation.
  if (
    /<!doctype\s+html|<html(?:\s|>)|<body(?:\s|>)|<svg(?:\s|>)|<style(?:\s|>)/i.test(code) ||
    /^<(?:(?:article|aside|button|div|form|header|main|nav|section|table|ul|ol)\b)/i.test(code)
  ) {
    return "html";
  }

  return "none";
}

function prepareHtmlPreview(source: string): string {
  const code = source.trim();
  if (/<!doctype\s+html|<html(?:\s|>)/i.test(code)) return code;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; color: #f5f2ea; background: #111; font: 16px/1.5 system-ui, sans-serif; }
    button, input, select, textarea { font: inherit; }
  </style></head><body>${code}</body></html>`;
}

// Renders a case-study code block as a real, running React component
// instead of static highlighted text. The code must end with a call to
// render(<YourComponent />) — react-live's convention for this mode
// (noInline), which keeps definitions above it in normal function/const
// syntax rather than requiring a single trailing JSX expression.
export function LiveComponentBlock({ code, chrome = "framed" }: LiveComponentBlockProps) {
  const mode = detectPreviewMode(code);
  if (mode === "html") {
    return <HtmlComponentSurface code={code} chrome={chrome} />;
  }
  if (mode === "none") {
    return <StaticCodeSurface code={code} chrome={chrome} />;
  }

  const preparedCode = prepareLiveCode(code);
  return (
    <LiveProvider
      code={preparedCode}
      scope={scope}
      noInline
      language="tsx"
      enableTypeScript
    >
      <LiveComponentSurface code={preparedCode} chrome={chrome} />
    </LiveProvider>
  );
}

function StaticCodeSurface({ code, chrome }: { code: string; chrome: "framed" | "minimal" }) {
  return (
    <div className={chrome === "framed" ? styles.frame : styles.minimal}>
      {chrome === "framed" && <div className={styles.header}><span className={styles.language}>code</span></div>}
      <pre className={styles.code}><code>{code}</code></pre>
    </div>
  );
}

function HtmlComponentSurface({ code, chrome }: { code: string; chrome: "framed" | "minimal" }) {
  const [view, setView] = React.useState<"preview" | "code">("preview");
  const [copied, setCopied] = React.useState(false);
  const html = prepareHtmlPreview(code);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={chrome === "framed" ? styles.frame : styles.minimal}>
      {chrome === "framed" && <div className={styles.header}>
        <span className={styles.language}>html</span>
        <div className={styles.headerActions}>
          <div className={styles.switcher} role="tablist" aria-label="HTML component view">
            <button type="button" role="tab" aria-selected={view === "preview"} className={view === "preview" ? styles.switcherActive : ""} onClick={() => setView("preview")}>Preview</button>
            <button type="button" role="tab" aria-selected={view === "code"} className={view === "code" ? styles.switcherActive : ""} onClick={() => setView("code")}>Code</button>
          </div>
          <button type="button" className={styles.copyButton} onClick={handleCopy} aria-label={copied ? "Copied" : "Copy code"} title={copied ? "Copied" : "Copy code"}>
            <span aria-hidden="true" className={styles.copyIcon}>{copied ? "✓" : ""}</span>
          </button>
        </div>
      </div>}
      {view === "preview" ? (
        <iframe className={styles.htmlPreview} title="Live HTML preview" sandbox="allow-scripts" srcDoc={html} />
      ) : (
        <pre className={styles.code}><code>{code}</code></pre>
      )}
    </div>
  );
}

function LiveComponentSurface({ code, chrome }: { code: string; chrome: "framed" | "minimal" }) {
  const { error, element } = React.useContext(LiveContext);
  const [view, setView] = React.useState<"preview" | "code">("preview");
  const [copied, setCopied] = React.useState(false);
  const canRender = Boolean(element) && !error;

  React.useEffect(() => {
    if (error) setView("code");
  }, [error]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={chrome === "framed" ? styles.frame : styles.minimal}>
      {chrome === "framed" && <div className={styles.header}>
        <span className={styles.language}>tsx</span>
        <div className={styles.headerActions}>
          {canRender && (
            <div className={styles.switcher} role="tablist" aria-label="Live component view">
              <button type="button" role="tab" aria-selected={view === "preview"} className={view === "preview" ? styles.switcherActive : ""} onClick={() => setView("preview")}>Preview</button>
              <button type="button" role="tab" aria-selected={view === "code"} className={view === "code" ? styles.switcherActive : ""} onClick={() => setView("code")}>Code</button>
            </div>
          )}
          <button type="button" className={styles.copyButton} onClick={handleCopy} aria-label={copied ? "Copied" : "Copy code"} title={copied ? "Copied" : "Copy code"}>
            <span aria-hidden="true" className={styles.copyIcon}>{copied ? "✓" : ""}</span>
          </button>
        </div>
      </div>}
      {view === "preview" && canRender ? (
        <div className={chrome === "minimal" ? styles.previewMinimal : styles.preview}><LivePreview /></div>
      ) : (
        <pre className={styles.code}><code>{code}</code></pre>
      )}
      {error && <LiveError className={styles.error} />}
    </div>
  );
}
