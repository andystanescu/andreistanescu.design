"use client";

import * as React from "react";
import { LiveContext, LiveProvider, LivePreview } from "react-live";
import styles from "./LiveComponentBlock.module.css";

type LiveComponentBlockProps = {
  code: string;
  chrome?: "framed" | "minimal";
  runtime?: "auto" | "react" | "html" | "static";
  language?: string;
  publicInline?: boolean;
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
    const component = code.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/)?.[1]
      ?? code.match(/(?:const|let)\s+([A-Z][A-Za-z0-9_]*)\s*(?::[^=]+)?=/)?.[1];
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

function prepareHtmlPreview(source: string, errorChannel: string, autoHeight: boolean): string {
  const code = source.trim();
  const security = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob: https:; media-src data: blob: https:; connect-src 'none'; font-src data:; form-action 'none'; base-uri 'none'">`;
  const reporter = `<script>(()=>{const channel=${JSON.stringify(errorChannel)};const send=(data)=>parent.postMessage({source:"conscept-live-preview",channel,...data},"*");const report=(message)=>send({type:"error",message:String(message||"Unknown runtime error")});window.addEventListener("error",event=>report(event.message));window.addEventListener("unhandledrejection",event=>report(event.reason?.message||event.reason));${autoHeight ? `window.addEventListener("message",event=>{const data=event.data;if(event.source===parent&&data?.source==="conscept-live-parent"&&data.channel===channel&&typeof data.color==="string"&&CSS.supports("color",data.color))document.documentElement.style.setProperty("--inline-parent-text",data.color)});let frame=0;const measure=()=>{frame=0;const body=document.body;if(!body)return;const rect=body.getBoundingClientRect();let bottom=rect.bottom+window.scrollY;for(const child of body.children){const box=child.getBoundingClientRect();bottom=Math.max(bottom,box.bottom+window.scrollY)}const margin=parseFloat(getComputedStyle(body).marginBottom)||0;send({type:"height",height:Math.ceil(Math.max(1,bottom+margin))})};const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure)};const start=()=>{if(!document.body)return;schedule();if(window.ResizeObserver)new ResizeObserver(schedule).observe(document.body);new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});document.fonts?.ready.then(schedule).catch(()=>{});};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();window.addEventListener("load",schedule);window.addEventListener("resize",schedule);` : ""}})();</script>`;
  if (/<!doctype\s+html|<html(?:\s|>)/i.test(code)) {
    if (/<head(?:\s|>)/i.test(code)) return code.replace(/<head([^>]*)>/i, `<head$1>${security}${reporter}`);
    return code.replace(/<html([^>]*)>/i, `<html$1><head>${security}${reporter}</head>`);
  }
  return `<!doctype html><html><head>${security}${reporter}<meta name="viewport" content="width=device-width, initial-scale=1"><style>
    :root { --bg-deep: #0a1020; --text-on-deep-primary: #ffffff; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: ${autoHeight ? "0" : "24px"}; color: ${autoHeight ? "var(--inline-parent-text, var(--text-on-deep-primary))" : "var(--text-on-deep-primary)"}; background: ${autoHeight ? "transparent" : "var(--bg-deep)"}; font: 16px/1.5 system-ui, sans-serif; }
    button, input, select, textarea { font: inherit; }
  </style></head><body>${code}</body></html>`;
}

// Renders a case-study code block as a real, running React component
// instead of static highlighted text. The code must end with a call to
// render(<YourComponent />) — react-live's convention for this mode
// (noInline), which keeps definitions above it in normal function/const
// syntax rather than requiring a single trailing JSX expression.
export function LiveComponentBlock({ code, chrome = "framed", runtime = "auto", language, publicInline = false }: LiveComponentBlockProps) {
  const [revision, setRevision] = React.useState(0);
  const mode: PreviewMode = runtime === "auto" ? detectPreviewMode(code) : runtime === "static" ? "none" : runtime;
  const displayChrome = (publicInline && mode !== "none") || /\bBeforeAfterComparison\b/.test(code) ? "minimal" : chrome;
  if (mode === "html") {
    return <HtmlComponentSurface code={code} chrome={displayChrome} language={language || "html"} autoHeight={publicInline} />;
  }
  if (mode === "none") {
    return <StaticCodeSurface code={code} chrome={displayChrome} language={language || "code"} />;
  }

  const preparedCode = prepareLiveCode(code);
  return (
    <LiveProvider
      key={revision}
      code={preparedCode}
      scope={scope}
      noInline
      language="tsx"
      enableTypeScript
    >
      <LiveComponentSurface code={preparedCode} chrome={displayChrome} onRetry={() => setRevision((value) => value + 1)} />
    </LiveProvider>
  );
}

function StaticCodeSurface({ code, chrome, language }: { code: string; chrome: "framed" | "minimal"; language: string }) {
  return (
    <div className={chrome === "framed" ? styles.frame : styles.minimal}>
      {chrome === "framed" && <div className={styles.header}><span className={styles.language}>{language}</span></div>}
      <pre className={styles.code}><code>{code}</code></pre>
    </div>
  );
}

function HtmlComponentSurface({ code, chrome, language, autoHeight }: { code: string; chrome: "framed" | "minimal"; language: string; autoHeight: boolean }) {
  const [view, setView] = React.useState<"preview" | "code">("preview");
  const [copied, setCopied] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [runtimeError, setRuntimeError] = React.useState("");
  const [revision, setRevision] = React.useState(0);
  const [height, setHeight] = React.useState(150);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const errorChannel = React.useId();
  const html = prepareHtmlPreview(code, errorChannel, autoHeight);

  React.useEffect(() => {
    const receiveError = (event: MessageEvent) => {
      const data = event.data as { source?: string; channel?: string; type?: string; message?: string; height?: number } | undefined;
      if (event.source !== iframeRef.current?.contentWindow || data?.source !== "conscept-live-preview" || data.channel !== errorChannel) return;
      if (data.type === "height" && autoHeight && typeof data.height === "number" && Number.isFinite(data.height) && data.height > 0 && data.height <= 100000) setHeight(Math.ceil(data.height));
      else if (data.type === "error") setRuntimeError(data.message || "The interactive preview failed to run.");
    };
    window.addEventListener("message", receiveError);
    return () => window.removeEventListener("message", receiveError);
  }, [errorChannel, autoHeight]);

  React.useEffect(() => {
    if (!autoHeight) return;
    const updateTheme = () => {
      const frame = iframeRef.current;
      if (frame) frame.contentWindow?.postMessage({ source: "conscept-live-parent", channel: errorChannel, color: getComputedStyle(frame).color }, "*");
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", updateTheme);
    return () => { observer.disconnect(); media.removeEventListener("change", updateTheme); };
  }, [autoHeight, errorChannel, loaded]);

  const retry = () => {
    setRuntimeError("");
    setLoaded(false);
    setRevision((value) => value + 1);
  };

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
        <span className={styles.language}>{language}</span>
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
      {view === "preview" ? runtimeError ? (
        <InteractiveErrorState message={runtimeError} onRetry={retry} />
      ) : (
        <div className={autoHeight ? styles.previewHostAuto : styles.previewHost}>{!loaded && <div className={styles.loading} role="status">Loading interactive preview…</div>}<iframe ref={iframeRef} key={revision} className={autoHeight ? styles.htmlPreviewAuto : styles.htmlPreview} style={autoHeight ? { height } : undefined} title="Live HTML preview" sandbox="allow-scripts" srcDoc={html} onLoad={() => setLoaded(true)} /></div>
      ) : (
        <pre className={styles.code}><code>{code}</code></pre>
      )}
    </div>
  );
}

function LiveComponentSurface({ code, chrome, onRetry }: { code: string; chrome: "framed" | "minimal"; onRetry: () => void }) {
  const { error, element } = React.useContext(LiveContext);
  const [view, setView] = React.useState<"preview" | "code">("preview");
  const [copied, setCopied] = React.useState(false);
  const canRender = Boolean(element) && !error;
  const activeView = view;

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
              <button type="button" role="tab" aria-selected={activeView === "preview"} className={activeView === "preview" ? styles.switcherActive : ""} onClick={() => setView("preview")}>Preview</button>
              <button type="button" role="tab" aria-selected={activeView === "code"} className={activeView === "code" ? styles.switcherActive : ""} onClick={() => setView("code")}>Code</button>
            </div>
          )}
          <button type="button" className={styles.copyButton} onClick={handleCopy} aria-label={copied ? "Copied" : "Copy code"} title={copied ? "Copied" : "Copy code"}>
            <span aria-hidden="true" className={styles.copyIcon}>{copied ? "✓" : ""}</span>
          </button>
        </div>
      </div>}
      {error ? (
        <InteractiveErrorState message={String(error)} onRetry={onRetry} />
      ) : activeView === "preview" && canRender ? (
        <div className={chrome === "minimal" ? styles.previewMinimal : styles.preview}><LivePreview /></div>
      ) : activeView === "preview" && !error ? (
        <div className={styles.loading} role="status">Loading interactive preview…</div>
      ) : (
        <pre className={styles.code}><code>{code}</code></pre>
      )}
    </div>
  );
}

function InteractiveErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className={styles.errorState} role="alert">
    <span className={styles.errorIcon} aria-hidden="true">!</span>
    <div><strong>Interactive demo unavailable</strong><p>This example could not load, but the rest of the case study is still available.</p></div>
    <button type="button" onClick={onRetry}>Try again</button>
    <details><summary>Technical details</summary><pre>{message}</pre></details>
  </div>;
}
