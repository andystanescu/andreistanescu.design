import { db } from "@/lib/db";

export type AboutSection = {
  key: string;
  eyebrow: string;
  headline: string;
  description: string;
  position: number;
  fixed: number;
  visible: number;
};

export function getSection(key: string): AboutSection | undefined {
  return db
    .prepare("SELECT * FROM about_sections WHERE key = ?")
    .get(key) as AboutSection | undefined;
}

export function getVisibleSection(key: string): AboutSection | undefined {
  return db.prepare("SELECT * FROM about_sections WHERE key = ? AND visible = 1").get(key) as AboutSection | undefined;
}

export function getAllSections(): AboutSection[] {
  return db
    .prepare("SELECT * FROM about_sections ORDER BY position ASC")
    .all() as AboutSection[];
}

// The order the reorderable (non-fixed) sections render in — Hero stays
// pinned above this, Nav/Footer are outside this page entirely.
export function getSectionOrder(): string[] {
  return (
    db
      .prepare(
        "SELECT key FROM about_sections WHERE fixed = 0 AND visible = 1 ORDER BY position ASC"
      )
      .all() as { key: string }[]
  ).map((r) => r.key);
}

export function updateSection(
  key: string,
  update: { eyebrow: string; headline: string; description: string; visible?: boolean }
) {
  db.prepare(
    "UPDATE about_sections SET eyebrow = ?, headline = ?, description = ?, visible = ? WHERE key = ?"
  ).run(update.eyebrow, update.headline, update.description, update.visible === false ? 0 : 1, key);
}

export function moveSectionPosition(key: string, direction: "up" | "down") {
  const sections = getAllSections().filter((s) => !s.fixed);
  const index = sections.findIndex((s) => s.key === key);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= sections.length) return;

  const current = sections[index];
  const swapWith = sections[swapIndex];
  const update = db.prepare("UPDATE about_sections SET position = ? WHERE key = ?");
  update.run(swapWith.position, current.key);
  update.run(current.position, swapWith.key);
}

export type AboutItem = {
  id: number;
  title: string;
  description: string;
  icon: string;
  position: number;
  published: number;
};

export function getPhilosophyItems(): AboutItem[] {
  return db
    .prepare(
      "SELECT * FROM about_philosophy_items WHERE published = 1 ORDER BY position ASC"
    )
    .all() as AboutItem[];
}

export function getAllPhilosophyItemsAdmin(): AboutItem[] {
  return db
    .prepare("SELECT * FROM about_philosophy_items ORDER BY position ASC")
    .all() as AboutItem[];
}

export function getHighlightItems(): AboutItem[] {
  return db
    .prepare(
      "SELECT * FROM about_highlight_items WHERE published = 1 ORDER BY position ASC"
    )
    .all() as AboutItem[];
}

export function getAllHighlightItemsAdmin(): AboutItem[] {
  return db
    .prepare("SELECT * FROM about_highlight_items ORDER BY position ASC")
    .all() as AboutItem[];
}

export type AboutExperience = {
  id: number;
  start_date: string;
  end_date: string;
  job_title: string;
  company_name: string;
  business_profile: string;
  description: string;
  position: number;
  published: number;
};

export function getExperiences(): AboutExperience[] {
  return db
    .prepare("SELECT * FROM about_experiences WHERE published = 1 ORDER BY position ASC, id ASC")
    .all() as AboutExperience[];
}

export function getAllExperiencesAdmin(): AboutExperience[] {
  return db
    .prepare("SELECT * FROM about_experiences ORDER BY position ASC, id ASC")
    .all() as AboutExperience[];
}
