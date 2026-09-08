export const LAYOUT_SECTIONS = {
  homepage: { hero: "Hero", services: "Services", approach: "Approach", selected_impact: "Selected Impact", latest_insights: "Latest Insights" },
  about: { hero: "Hero", drives_me: "What Drives Me", philosophy: "Philosophy", highlights: "Highlights", latest_insights: "Latest Insights", before_conscept: "Before ConScept" },
};
export type LayoutPage = keyof typeof LAYOUT_SECTIONS;
export type LayoutSection = { key: string; label: string; visible: boolean; fixed: boolean };
export function isLayoutPage(value: string): value is LayoutPage {
  return value === "homepage" || value === "about";
}
export function layoutSections(page: LayoutPage, rows: { key: string; visible: number; fixed: number }[]): LayoutSection[] {
  const labels: Record<string, string> = LAYOUT_SECTIONS[page];
  return rows.filter((row) => Object.hasOwn(labels, row.key)).map((row) => ({
    key: row.key, label: labels[row.key], visible: row.key === "hero" || Boolean(row.visible), fixed: row.key === "hero" || Boolean(row.fixed),
  })).sort((a, b) => Number(b.fixed) - Number(a.fixed));
}
