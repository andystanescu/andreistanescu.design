// Estimated read time for an article body — derived from word count at
// render time (200 wpm, the conventional average), not stored: it should
// always reflect the current body, never go stale after an edit.
export function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
