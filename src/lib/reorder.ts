import { db } from "@/lib/db";

// Rewrites `position` for a set of rows to match `orderedIds`. Used by
// drag-and-drop reordering, where an item can move multiple spots in one
// action — unlike the pairwise position swap the move up/down buttons use,
// this rewrites the whole order at once. `orderedIds` should be exactly the
// subset being reordered (e.g. only nav-visible pages, only non-fixed
// homepage sections) — rows outside that subset are untouched.
//
// Positions are permuted among the VALUES this subset already holds
// (sorted ascending, then reassigned in `orderedIds` order), rather than
// reset to 0, 1, 2… — e.g. Pages only ever lists a subset of the table's
// rows (see RELOCATED_PAGE_SLUGS), so fabricating fresh 0-based positions
// here would collide with rows outside the subset that already occupy
// those same low numbers.
export function reorderByIds(
  table: string,
  idColumn: string,
  orderedIds: (string | number)[]
) {
  if (orderedIds.length === 0) return;
  const placeholders = orderedIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT position FROM ${table} WHERE ${idColumn} IN (${placeholders})`
    )
    .all(...orderedIds) as { position: number }[];
  const positions = rows.map((r) => r.position).sort((a, b) => a - b);

  const stmt = db.prepare(`UPDATE ${table} SET position = ? WHERE ${idColumn} = ?`);
  orderedIds.forEach((id, index) => stmt.run(positions[index], id));
}
