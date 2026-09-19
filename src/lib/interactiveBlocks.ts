function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

export type ContentSegment =
  | { type: "html"; content: string }
  | { type: "live"; code: string; chrome: "framed" | "minimal" }
  | { type: "relatedInsight"; slug: string }
  | { type: "gallery"; images: Array<{ src: string; alt?: string; caption?: string }> };

// A code block toggled "⚡ Live" in the editor (RichTextEditor's
// InteractiveCodeBlock) round-trips as <pre data-interactive="true">. This
// pulls those out of the HTML string so RichContent can render them as a
// real running React component instead of highlighted text — the rest of
// the content stays a plain HTML string, unaffected.
export function splitInteractiveBlocks(html: string): ContentSegment[] {
  const re = /<pre data-interactive="true"(?: data-chrome="(minimal|framed)")?><code(?:\s+class="[^"]*")?>([\s\S]*?)<\/code><\/pre>|<aside data-related-insight="([^"]+)"(?: data-title="[^"]*")?><\/aside>|<aside data-image-gallery="([^"]+)"><\/aside>/g;
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html))) {
    if (match.index > lastIndex) {
      segments.push({ type: "html", content: html.slice(lastIndex, match.index) });
    }
    if (match[3]) segments.push({ type: "relatedInsight", slug: decodeEntities(match[3]) });
    else if (match[4]) {
      try {
        const images = JSON.parse(decodeURIComponent(decodeEntities(match[4])));
        if (Array.isArray(images)) segments.push({ type: "gallery", images });
      } catch { /* Ignore malformed legacy content without breaking the article. */ }
    } else segments.push({ type: "live", chrome: match[1] === "minimal" ? "minimal" : "framed", code: decodeEntities(match[2]) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < html.length) {
    segments.push({ type: "html", content: html.slice(lastIndex) });
  }
  return segments;
}
