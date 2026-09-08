import { db } from "@/lib/db";
import { layoutSections, type LayoutPage } from "./layoutDraft";

export function getLayoutConfiguration(page: LayoutPage) {
  const table = page === "homepage" ? "homepage_sections" : "about_sections";
  const rows = db.prepare(`SELECT key, visible, fixed FROM ${table} ORDER BY position ASC, key ASC`).all() as { key: string; visible: number; fixed: number }[];
  const sections = layoutSections(page, rows);
  return { sections, revision: JSON.stringify(sections) };
}
