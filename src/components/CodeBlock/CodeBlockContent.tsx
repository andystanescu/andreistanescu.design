"use client";

import styles from "./CodeBlockContent.module.css";

function decorateCodeBlocks(html: string): string {
  return html.replace(/<pre([^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (_match, preAttributes: string, codeAttributes: string, code: string) => {
    const language = codeAttributes.match(/(?:language-|lang-)([a-z0-9+#.-]+)/i)?.[1] || preAttributes.match(/data-language="([^"]+)"/i)?.[1] || "Code";
    const title = preAttributes.match(/data-title="([^"]+)"/i)?.[1];
    const label = title || language.toUpperCase();
    return `<div class="${styles.frame}"><div class="${styles.header}"><span>${label}</span><button type="button" data-copy-code aria-label="Copy ${label} code">Copy</button></div><pre${preAttributes} tabindex="0" aria-label="${label} code, horizontally scrollable"><code${codeAttributes}>${code}</code></pre></div>`;
  });
}

export function CodeBlockContent({ html, className }: { html: string; className: string }) {
  const decoratedHtml = decorateCodeBlocks(html);
  return <div className={className} onClick={async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-copy-code]");
    if (!button) return;
    const code = button.closest(`.${styles.frame}`)?.querySelector("code")?.textContent || "";
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = "Copied";
      window.setTimeout(() => { button.textContent = "Copy"; }, 1600);
    } catch {
      button.textContent = "Copy failed";
      window.setTimeout(() => { button.textContent = "Copy"; }, 1600);
    }
  }} dangerouslySetInnerHTML={{ __html: decoratedHtml }} />;
}
