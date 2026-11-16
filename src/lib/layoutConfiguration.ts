import { db } from "@/lib/db";
import { layoutSections, type LayoutPage } from "./layoutDraft";
import { insightsAvailable, servicesAvailable } from "./features";

export function getLayoutConfiguration(page: LayoutPage) {
  const table = page === "homepage" ? "homepage_sections" : "about_sections";
  const rows = db.prepare(`SELECT key, visible, fixed FROM ${table} ORDER BY position ASC, key ASC`).all() as { key: string; visible: number; fixed: number }[];
  const sections = layoutSections(page, rows).filter((section) => (page !== "homepage" || servicesAvailable() || section.key !== "services") && (insightsAvailable() || section.key !== "latest_insights"));
  return { sections, revision: JSON.stringify(sections) };
}
