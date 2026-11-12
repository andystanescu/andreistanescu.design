import { db } from "@/lib/db";

/** Tags remain free text; suggestions combine saved article and case-study tags. */
export function getExistingTags(): string[] {
  const rows = db.prepare("SELECT tags FROM insights UNION ALL SELECT tags FROM case_studies").all() as Array<{ tags: string }>;
  const unique = new Map<string, string>();
  for (const { tags } of rows) {
    for (const value of (tags || "").split(/[,;\n|*·]+/)) {
      const tag = value.trim();
      if (tag && !unique.has(tag.toLocaleLowerCase())) unique.set(tag.toLocaleLowerCase(), tag);
    }
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b));
}
