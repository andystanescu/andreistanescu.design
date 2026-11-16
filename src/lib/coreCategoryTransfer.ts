import type { DatabaseSync } from "node:sqlite";

export type CategoryAssignment = { slug: string; category_names: string[] };

export function importCoreCategories(db: DatabaseSync, records: Array<Record<string, unknown>>) {
  for (const record of records) {
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) continue;
    const aliases = Array.isArray(record.aliases) ? record.aliases.filter((alias): alias is string => typeof alias === "string" && Boolean(alias.trim())).map((alias) => alias.trim()) : [];
    const find = db.prepare("SELECT category_id FROM category_legacy_names WHERE name = ? COLLATE NOCASE");
    const owners = new Set([name, ...aliases].map((alias) => (find.get(alias) as { category_id: number } | undefined)?.category_id).filter((id): id is number => id !== undefined));
    if (owners.size > 1) throw new Error(`Category ${name} conflicts with existing category aliases.`);
    let id = [...owners][0];
    const description = typeof record.description === "string" ? record.description : "";
    const position = typeof record.position === "number" ? Math.round(record.position) : 0;
    if (!id) id = Number(db.prepare("INSERT INTO categories(name, description, position) VALUES (?, ?, ?)").run(name, description, position).lastInsertRowid);
    else {
      const prior = db.prepare("SELECT name FROM categories WHERE id = ?").get(id) as { name: string };
      db.prepare("UPDATE categories SET name = ?, description = ?, position = ? WHERE id = ?").run(name, description, position, id);
      db.prepare("UPDATE case_studies SET category = ? WHERE category = ? COLLATE NOCASE").run(name, prior.name);
    }
    for (const alias of [name, ...aliases]) db.prepare("INSERT OR IGNORE INTO category_legacy_names(name, category_id) VALUES (?, ?)").run(alias, id);
  }
}

/** Portable names and aliases, rather than installation-specific numeric IDs. */
export function exportCategoryAssignments(db: DatabaseSync): CategoryAssignment[] {
  const assignments = new Map<string, string[]>();
  for (const { slug } of db.prepare("SELECT slug FROM case_studies ORDER BY id").all() as Array<{ slug: string }>) assignments.set(slug, []);
  const rows = db.prepare(`SELECT s.slug, c.name FROM case_study_categories sc JOIN case_studies s ON s.id = sc.case_study_id JOIN categories c ON c.id = sc.category_id ORDER BY s.id, sc.position, sc.category_id`).all() as Array<{ slug: string; name: string }>;
  const pending = db.prepare("SELECT p.study_slug AS slug, c.name FROM pending_case_study_categories p JOIN categories c ON c.id = p.category_id ORDER BY p.study_slug, p.position, p.category_id").all() as Array<{ slug: string; name: string }>;
  for (const { slug, name } of [...rows, ...pending]) { const names = assignments.get(slug) ?? []; if (!names.includes(name)) names.push(name); assignments.set(slug, names); }
  return Array.from(assignments, ([slug, category_names]) => ({ slug, category_names }));
}

/** Caller owns the transaction; unresolved studies retain their links for later import. */
export function importCategoryAssignments(db: DatabaseSync, assignments: Array<Record<string, unknown>>) {
  for (const record of assignments) {
    const slug = typeof record.slug === "string" ? record.slug.trim() : "";
    if (!slug || !Array.isArray(record.category_names)) throw new Error("Invalid category assignment in export.");
    if (record.category_names.some((name: unknown) => typeof name !== "string" || !name.trim())) throw new Error(`Invalid category name for case study ${slug}.`);
    const names = [...new Set(record.category_names.filter((name): name is string => typeof name === "string" && Boolean(name.trim())).map((name) => name.trim()))];
    const ids = [...new Set(names.map((name) => {
      const category = db.prepare("SELECT category_id FROM category_legacy_names WHERE name = ? COLLATE NOCASE").get(name) as { category_id: number } | undefined;
      if (!category) throw new Error(`Category ${name} is missing from the import.`);
      return category.category_id;
    }))];
    const study = db.prepare("SELECT id FROM case_studies WHERE slug = ?").get(slug) as { id: number } | undefined;
    db.prepare("DELETE FROM pending_case_study_categories WHERE study_slug = ?").run(slug);
    if (study) {
      db.prepare("DELETE FROM case_study_categories WHERE case_study_id = ?").run(study.id);
      ids.forEach((categoryId, position) => db.prepare("INSERT INTO case_study_categories(case_study_id, category_id, position) VALUES (?, ?, ?)").run(study.id, categoryId, position));
      db.prepare("UPDATE case_studies SET category = COALESCE((SELECT name FROM categories WHERE id = ?), '') WHERE id = ?").run(ids[0] ?? null, study.id);
    } else {
      ids.forEach((categoryId, position) => db.prepare("INSERT INTO pending_case_study_categories(study_slug, category_id, position) VALUES (?, ?, ?)").run(slug, categoryId, position));
    }
  }
}
