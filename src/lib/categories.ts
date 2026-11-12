import { db } from "@/lib/db";

export type Category = { id: number; name: string };

export function getCategories(): Category[] {
  return db.prepare("SELECT id, name FROM categories ORDER BY name COLLATE NOCASE, id").all() as Category[];
}

/** Resolve names still used by service and article records during migration. */
export function getCategoryNamesForLegacyName(name: string): string[] {
  const rows = db.prepare(`SELECT aliases.name FROM category_legacy_names source
    JOIN category_legacy_names aliases ON aliases.category_id = source.category_id
    WHERE source.name = ? COLLATE NOCASE`).all(name) as Array<{ name: string }>;
  return rows.length ? rows.map((row) => row.name) : [name];
}

export function getCaseStudyCategoryIds(id: number): number[] {
  return (db.prepare("SELECT category_id FROM case_study_categories WHERE case_study_id = ? ORDER BY position, category_id").all(id) as Array<{ category_id: number }>).map((row) => row.category_id);
}

/** Validate submitted IDs before saving; retain their order for the existing primary label. */
export function readCategorySelection(form: FormData): Category[] | null {
  if (!form.has("categories_present")) return null;
  const ids = [...new Set(form.getAll("category_ids").map(String))];
  if (ids.some((id) => !/^[1-9]\d*$/.test(id))) throw new Error("Invalid category");
  const find = db.prepare("SELECT id, name FROM categories WHERE id = ?");
  return ids.map((id) => {
    const category = find.get(Number(id)) as Category | undefined;
    if (!category) throw new Error("Invalid category");
    return category;
  });
}

/** Caller owns the transaction. */
export function replaceCaseStudyCategories(studyId: number, categories: Category[]) {
  db.prepare("DELETE FROM case_study_categories WHERE case_study_id = ?").run(studyId);
  const insert = db.prepare("INSERT INTO case_study_categories(case_study_id, category_id, position) VALUES (?, ?, ?)");
  categories.forEach((category, index) => insert.run(studyId, category.id, index));
}
