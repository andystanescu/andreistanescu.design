type AccentTextProps = {
  text: string;
  /** Defaults to --text-accent. Hero uses --accent-foundation (a deliberate
   * exception, not --text-accent, decided earlier for that one span). */
  color?: string;
};

// Renders plain text where #word# becomes accent-colored — same convention
// as headings in rich text bodies (src/lib/headingAccents.ts), but for the
// plain single-line text fields on homepage sections (headline/description
// aren't rich HTML, so there's no editor round-trip to worry about here).
export function AccentText({ text, color = "var(--text-accent)" }: AccentTextProps) {
  const parts = text.split(/#([^#]+)#/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{ color }}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
