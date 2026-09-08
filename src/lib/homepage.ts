import { db } from "@/lib/db";

export type HomepageSection = {
  key: string;
  eyebrow: string;
  headline: string;
  description: string;
  position: number;
  fixed: number;
  visible: number;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
};

export function getSection(key: string): HomepageSection | undefined {
  return db
    .prepare("SELECT * FROM homepage_sections WHERE key = ?")
    .get(key) as HomepageSection | undefined;
}

export function getVisibleSection(key: string): HomepageSection | undefined {
  return db.prepare("SELECT * FROM homepage_sections WHERE key = ? AND visible = 1").get(key) as HomepageSection | undefined;
}

export function getAllSections(): HomepageSection[] {
  return db
    .prepare("SELECT * FROM homepage_sections ORDER BY position ASC")
    .all() as HomepageSection[];
}

// The order the reorderable (non-fixed) sections render in — Hero stays
// pinned above this, Footer below, both outside this list entirely.
export function getSectionOrder(): string[] {
  return (
    db
      .prepare(
        "SELECT key FROM homepage_sections WHERE fixed = 0 AND visible = 1 ORDER BY position ASC"
      )
      .all() as { key: string }[]
  ).map((r) => r.key);
}

export function updateSection(
  key: string,
  update: {
    eyebrow: string;
    headline: string;
    description: string;
    ctaPrimaryLabel?: string;
    ctaPrimaryHref?: string;
    ctaSecondaryLabel?: string;
    ctaSecondaryHref?: string;
    visible?: boolean;
  }
) {
  db.prepare(
    `UPDATE homepage_sections
     SET eyebrow = ?, headline = ?, description = ?,
         cta_primary_label = ?, cta_primary_href = ?,
         cta_secondary_label = ?, cta_secondary_href = ?, visible = ?
     WHERE key = ?`
  ).run(
    update.eyebrow,
    update.headline,
    update.description,
    update.ctaPrimaryLabel ?? "",
    update.ctaPrimaryHref ?? "",
    update.ctaSecondaryLabel ?? "",
    update.ctaSecondaryHref ?? "",
    update.visible === false ? 0 : 1,
    key
  );
}

export function moveSectionPosition(key: string, direction: "up" | "down") {
  const sections = getAllSections().filter((s) => !s.fixed);
  const index = sections.findIndex((s) => s.key === key);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= sections.length) return;

  const current = sections[index];
  const swapWith = sections[swapIndex];
  const update = db.prepare(
    "UPDATE homepage_sections SET position = ? WHERE key = ?"
  );
  update.run(swapWith.position, current.key);
  update.run(current.position, swapWith.key);
}
