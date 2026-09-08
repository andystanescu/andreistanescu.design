import { createLowlight, common } from "lowlight";
import { toHtml } from "hast-util-to-html";

const lowlight = createLowlight(common);

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

// The editor only stores plain code text (TipTap's live syntax-highlight
// decorations aren't part of the saved HTML) — so highlighting is applied
// here, at render time, for the public pages. `class="language-xxx"` comes
// from the editor's code block language attribute when set; otherwise the
// language is auto-detected.
export function highlightCodeBlocks(html: string): string {
  return html.replace(
    /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g,
    (_match, lang: string | undefined, codeHtml: string) => {
      const code = decodeEntities(codeHtml);
      const tree =
        lang && lowlight.registered(lang)
          ? lowlight.highlight(lang, code)
          : lowlight.highlightAuto(code);
      const highlighted = toHtml(tree);
      return `<pre><code class="hljs">${highlighted}</code></pre>`;
    }
  );
}
