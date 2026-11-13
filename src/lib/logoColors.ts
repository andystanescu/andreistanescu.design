import type { ThemePalettes, PaletteRole, ThemeTone } from "@/lib/themePalette";

export type LogoColorMapping = { light: Record<string, string>; dark: Record<string, string> };
export const emptyLogoColorMapping = (): LogoColorMapping => ({ light: {}, dark: {} });
const roles: PaletteRole[] = ["primary", "secondary", "accent", "neutral"];
const colorValue = "(?:#[0-9a-fA-F]{6}(?![0-9a-fA-F])|#[0-9a-fA-F]{3}(?![0-9a-fA-F])|\\b(?:black|white)\\b|rgb\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*\\))";
const attributes = new RegExp(`(\\b(?:fill|stroke|stop-color)\\s*=\\s*["'])(${colorValue})(["'])`, "gi");
const declarations = new RegExp(`(\\b(?:fill|stroke|stop-color)\\s*:\\s*)(${colorValue})(?=[\\s;}'"])`, "gi");

export function normalizeLogoColor(value: string): string | null {
  const text = value.trim().toUpperCase();
  if (text === "BLACK") return "#000000";
  if (text === "WHITE") return "#FFFFFF";
  if (/^#[0-9A-F]{3}$/.test(text)) return `#${[...text.slice(1)].map((c) => c + c).join("")}`;
  if (/^#[0-9A-F]{6}$/.test(text)) return text;
  const rgb = text.match(/^RGB\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (!rgb || rgb.slice(1).some((component) => Number(component) > 255)) return null;
  return `#${rgb.slice(1).map((component) => Number(component).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function visitColors(svg: string, replace: (color: string, original: string) => string): string {
  const transform = (_match: string, before: string, value: string, after = "") => {
    const color = normalizeLogoColor(value);
    return `${before}${color ? replace(color, value) : value}${after}`;
  };
  return svg.replace(attributes, transform).replace(declarations, (_match, before: string, value: string) => transform(_match, before, value));
}

export function extractLogoColors(svg: string): string[] {
  const found = new Set<string>();
  visitColors(svg, (color, original) => { found.add(color); return original; });
  return [...found];
}

export function parseLogoColorMapping(raw: string): LogoColorMapping {
  const result = emptyLogoColorMapping();
  try {
    const data: unknown = JSON.parse(raw || "{}");
    if (!data || typeof data !== "object" || Array.isArray(data)) return result;
    for (const mode of ["light", "dark"] as const) {
      const group = (data as Record<string, unknown>)[mode];
      if (!group || typeof group !== "object" || Array.isArray(group)) continue;
      for (const [key, value] of Object.entries(group).slice(0, 128)) {
        const color = normalizeLogoColor(key);
        if (color && typeof value === "string" && (value === "original" || value === "white" || value === "black" || /^(primary|secondary|accent|neutral):(50|100|200|300|400|500|600|700|800|900|950)$/.test(value))) result[mode][color] = value;
      }
    }
  } catch { /* Invalid saved values fall back to the uploaded logo. */ }
  return result;
}

export function resolveLogoColor(selection: string | undefined, original: string, palettes: ThemePalettes): string {
  if (selection === "white") return "#FFFFFF";
  if (selection === "black") return "#000000";
  const [role, toneText] = (selection ?? "").split(":");
  const tone = Number(toneText) as ThemeTone;
  return roles.includes(role as PaletteRole) && /^(50|100|200|300|400|500|600|700|800|900|950)$/.test(toneText ?? "") ? palettes[role as PaletteRole][tone] : original;
}

export function recolorLogoSvg(svg: string, mapping: Record<string, string>, palettes: ThemePalettes): string {
  return visitColors(svg, (color, original) => mapping[color] ? resolveLogoColor(mapping[color], color, palettes) : original);
}
