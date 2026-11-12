export const SECTION_LAYOUTS = [
  ["design-systems", "Ecosystem"],
  ["product-architecture", "Landscape"],
  ["ai-enabled-design-operations", "Workflow"],
  ["governance-scale", "Decision paths"],
  ["collaboration-alignment", "Convergence"],
] as const;

export const SERVICE_SECTION_KEYS = ["additionalContent", "outcomes", "work", "tension", "alignment", "agreement", "operationalLoop", "changeModel", "ecosystem", "transformation", "approach", "evidence", "recognition"] as const;
export type ServiceSectionKey = typeof SERVICE_SECTION_KEYS[number];
export type SectionLayoutKey = "outcomes" | "work" | "recognition";
export type ServiceSectionSettings = {
  layouts: Partial<Record<SectionLayoutKey, string>>;
  visibility: Partial<Record<ServiceSectionKey, boolean>>;
  approachCode: string;
  order?: ServiceSectionKey[];
};

export const SECTION_LAYOUT_OPTIONS: Record<SectionLayoutKey, readonly (readonly [string, string])[]> = {
  outcomes: [["design-systems", "Columns"], ["ai-enabled-design-operations", "Progression"], ["governance-scale", "Reinforcing"], ["collaboration-alignment", "Converging"]],
  work: [["design-systems", "Grid"], ["product-architecture", "Split"], ["governance-scale", "List"], ["collaboration-alignment", "Connected"]],
  recognition: [["design-systems", "Staggered"], ["governance-scale", "Split"], ["collaboration-alignment", "Converging"]],
};

export function canonicalSectionLayout(section: SectionLayoutKey, layout: string): string {
  if (section === "outcomes" && layout === "product-architecture") return "design-systems";
  if (section === "work" && layout === "ai-enabled-design-operations") return "product-architecture";
  if (section === "recognition" && (layout === "product-architecture" || layout === "ai-enabled-design-operations")) return "design-systems";
  return layout;
}

export function getServiceSectionOrder(settings: ServiceSectionSettings, template: string, hasBody = true): ServiceSectionKey[] {
  const special: Partial<Record<string, ServiceSectionKey[]>> = {
    "design-systems": ["ecosystem"], "ai-enabled-design-operations": ["operationalLoop"],
    "governance-scale": ["tension", "changeModel"], "collaboration-alignment": ["alignment", "agreement"],
  };
  const defaults: ServiceSectionKey[] = ["additionalContent", "outcomes", ...(template === "governance-scale" ? ["tension" as const] : []), "work", ...(special[template] ?? []).filter((key) => key !== "tension"), "approach", "evidence", "recognition"];
  const available = defaults.filter((key) => key !== "additionalContent" || hasBody);
  const order = (settings.order ?? []).filter((key) => available.includes(key));
  return [...order, ...available.filter((key) => !order.includes(key))];
}

export function parseServiceSectionSettings(raw: string): ServiceSectionSettings {
  const result: ServiceSectionSettings = { layouts: {}, visibility: {}, approachCode: "" };
  try {
    const source: unknown = JSON.parse(raw || "{}");
    if (!source || typeof source !== "object" || Array.isArray(source)) return result;
    const value = source as Record<string, unknown>;
    if (value.layouts && typeof value.layouts === "object" && !Array.isArray(value.layouts)) {
      const layouts = value.layouts as Record<string, unknown>;
      for (const key of ["outcomes", "work", "recognition"] as const) {
        if (typeof layouts[key] === "string" && SECTION_LAYOUTS.some(([id]) => id === layouts[key])) result.layouts[key] = layouts[key] as string;
      }
    }
    if (value.visibility && typeof value.visibility === "object" && !Array.isArray(value.visibility)) {
      const visibility = value.visibility as Record<string, unknown>;
      for (const key of SERVICE_SECTION_KEYS) if (typeof visibility[key] === "boolean") result.visibility[key] = visibility[key] as boolean;
    }
    if (typeof value.approachCode === "string") result.approachCode = value.approachCode.slice(0, 100000);
    if (Array.isArray(value.order)) result.order = [...new Set(value.order.filter((key): key is ServiceSectionKey => typeof key === "string" && SERVICE_SECTION_KEYS.includes(key as ServiceSectionKey) && key !== "transformation"))];
  } catch { /* Retain safe defaults for malformed saved settings. */ }
  return result;
}

export function sectionVisible(settings: ServiceSectionSettings, section: ServiceSectionKey, template: string): boolean {
  return settings.visibility[section] ?? (template !== "custom" || section === "evidence" || section === "additionalContent");
}

export function sectionLayout(settings: ServiceSectionSettings, section: SectionLayoutKey, template: string): string {
  return settings.layouts[section] ?? (SECTION_LAYOUTS.some(([id]) => id === template) ? template : "design-systems");
}
