// In headings only, #word# (or #a few words#) becomes accent-colored text —
// applied once at save time so the stored HTML is the final, canonical
// version (same as re-opening a Markdown "**bold**" and seeing real bold,
// not asterisks). Restricted to headings: the same syntax elsewhere in the
// body is left as literal "#text#".
export function applyHeadingAccents(html: string): string {
  return html.replace(
    /<(h[1-3])([^>]*)>([\s\S]*?)<\/\1>/g,
    (_match, tag: string, attrs: string, inner: string) => {
      const replaced = inner.replace(
        /#([^#<>]+)#/g,
        '<span class="accent">$1</span>'
      );
      return `<${tag}${attrs}>${replaced}</${tag}>`;
    }
  );
}
