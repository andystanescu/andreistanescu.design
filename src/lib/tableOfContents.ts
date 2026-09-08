export type TocItem = {
  id: string;
  text: string;
};

function slugify(text: string, fallback: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return slug || fallback;
}

// "On this page" is built from the article's own section headings. Articles
// written in the admin editor may use H2 or H3 for chapter headings, so both
// levels are included and receive stable anchor ids.
export function addHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const seen = new Map<string, number>();
  let index = 0;

  const outHtml = html.replace(
    /<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_match, tag: string, attrs: string, inner: string) => {
      index += 1;
      const text = inner.replace(/<[^>]+>/g, "").trim();
      const base = slugify(text, `section-${index}`);
      const seenCount = seen.get(base) ?? 0;
      seen.set(base, seenCount + 1);
      const id = seenCount > 0 ? `${base}-${seenCount}` : base;

      toc.push({ id, text });

      const cleanedAttrs = attrs.replace(/\s*id="[^"]*"/, "");
      return `<${tag}${cleanedAttrs} id="${id}">${inner}</${tag}>`;
    }
  );

  return { html: outHtml, toc };
}
