import { getSettings } from "@/lib/settings";
import { DEFAULT_PALETTE_ANCHORS, parsePublishedTheme, THEME_TONES, type ThemePalette, type ThemeTone } from "@/lib/themePalette";

export const dynamic = "force-dynamic";

function cssResponse(css: string) {
  return new Response(css, { headers: { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "no-store, max-age=0" } });
}

function declarations(values: Record<string, string>) {
  return Object.entries(values).map(([token, color]) => `  ${token}: ${color};`).join("\n");
}

function buildPublishedCss(theme: NonNullable<ReturnType<typeof parsePublishedTheme>>) {
  const palettes = Object.entries(theme.palettes).flatMap(([role, palette]) => THEME_TONES.map((tone) => [`--brand-${role}-${tone}`, palette[tone]] as const));
  const primitive: Record<string, string> = Object.fromEntries(palettes);
  const neutral = theme.palettes.neutral;
  const neutralAliases: Record<string, ThemeTone> = {
    "--colour-neutral-000": 50, "--colour-neutral-50": 50, "--colour-neutral-100": 100,
    "--colour-neutral-200": 200, "--colour-neutral-300": 300, "--colour-neutral-400": 400,
    "--colour-neutral-450": 400, "--colour-neutral-500": 500, "--colour-neutral-550": 600,
    "--colour-neutral-600": 600, "--colour-neutral-700": 700, "--colour-neutral-800": 800,
    "--colour-neutral-900": 900, "--colour-neutral-950": 950,
  };
  for (const [token, tone] of Object.entries(neutralAliases)) primitive[token] = neutral[tone];
  const orangeAliases: Record<string, ThemeTone> = {
    "--colour-orange-300": 300, "--colour-orange-400": 400, "--colour-orange-500": 500,
    "--colour-orange-600": 600, "--colour-orange-700": 700, "--colour-orange-800": 800,
    "--colour-orange-900": 900,
  };
  for (const [token, tone] of Object.entries(orangeAliases)) primitive[token] = theme.palettes.accent[tone];
  const light = { ...theme.semantic.light, "--focus-ring": theme.semantic.light["--border-focus"] };
  const dark = { ...theme.semantic.dark, "--focus-ring": theme.semantic.dark["--border-focus"] };
  const root = `:root {\n${declarations(primitive)}\n${declarations(light)}\n}\n`;
  const lightRules = `:root, [data-theme="light"], .section-light {\n${declarations(light)}\n}\n`;
  const darkRules = `[data-theme="dark"], .section-dark {\n${declarations(dark)}\n}\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${declarations(dark).split("\n").map((line) => `  ${line}`).join("\n")}\n  }\n}\n`;
  return root + lightRules + darkRules;
}

// Compatibility palette for themes saved by the first Site identity release.
function createLegacyRamp(seed: string): ThemePalette {
  const red = Number.parseInt(seed.slice(1, 3), 16) / 255;
  const green = Number.parseInt(seed.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(seed.slice(5, 7), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  if (delta) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const hsl = (s: number, l: number) => {
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const section = hue / 60;
    const x = chroma * (1 - Math.abs((section % 2) - 1));
    const m = l - chroma / 2;
    const values = section < 1 ? [chroma, x, 0] : section < 2 ? [x, chroma, 0] : section < 3 ? [0, chroma, x] : section < 4 ? [0, x, chroma] : section < 5 ? [x, 0, chroma] : [chroma, 0, x];
    return `#${values.map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
  };
  const palette = { 500: seed.toUpperCase() } as ThemePalette;
  const light: Record<number, number> = { 50: 0.96, 100: 0.9, 200: 0.78, 300: 0.62, 400: 0.4 };
  const dark: Record<number, number> = { 600: 0.14, 700: 0.29, 800: 0.48, 900: 0.7, 950: 0.82 };
  for (const [tone, amount] of Object.entries(light)) palette[Number(tone) as ThemeTone] = hsl(saturation * (1 - amount * 0.34), lightness + (1 - lightness) * amount);
  for (const [tone, amount] of Object.entries(dark)) palette[Number(tone) as ThemeTone] = hsl(saturation * (1 - amount * 0.08), lightness * (1 - amount));
  return palette;
}

function legacyCss(settings: ReturnType<typeof getSettings>) {
  const palettes = {
    primary: createLegacyRamp(settings.theme_primary_500),
    secondary: createLegacyRamp(settings.theme_secondary_500),
    accent: createLegacyRamp(settings.theme_accent_500),
    neutral: createLegacyRamp(settings.theme_neutral_500),
  };
  const toneVars = Object.entries(palettes).flatMap(([role, palette]) => THEME_TONES.map((tone) => `  --brand-${role}-${tone}: ${palette[tone]};`)).join("\n");
  const neutralVars = THEME_TONES.map((tone) => `  --colour-neutral-${tone}: var(--brand-neutral-${tone});`).join("\n");
  return `:root {\n${toneVars}\n${neutralVars}\n  --action-primary-bg: var(--brand-primary-500);\n  --action-primary-text: #FFFFFF;\n  --action-primary-hover: var(--brand-primary-600);\n  --accent-foundation: var(--brand-accent-500);\n  --accent-system: var(--brand-secondary-500);\n}\n:root, [data-theme="light"], .section-light {\n  --bg-canvas: var(--brand-neutral-50); --bg-surface: var(--brand-neutral-50);\n  --bg-subtle: var(--brand-neutral-100); --bg-inset: var(--brand-neutral-100);\n  --bg-inverse: var(--brand-neutral-900); --bg-field: var(--brand-neutral-50);\n  --text-primary: var(--brand-neutral-900); --text-secondary: var(--brand-neutral-700);\n  --text-tertiary: var(--brand-neutral-600); --text-placeholder: var(--brand-neutral-600);\n  --text-accent: var(--brand-accent-700); --border-default: var(--brand-neutral-200);\n  --border-strong: var(--brand-neutral-300); --border-field: var(--brand-neutral-600);\n  --border-field-hover: var(--brand-neutral-700); --border-focus: var(--brand-neutral-900);\n  --action-secondary-text: var(--brand-secondary-700); --action-secondary-border: var(--brand-secondary-500);\n  --action-secondary-hover: var(--brand-secondary-50); --action-link-hover: var(--brand-accent-700);\n  --action-link-pressed: var(--brand-accent-800); --action-primary-hover: var(--brand-primary-600);\n  --action-primary-pressed: var(--brand-primary-700); --accent-foundation: var(--brand-accent-500);\n  --accent-system: var(--brand-secondary-500);\n}\n[data-theme="dark"], .section-dark {\n  --bg-canvas: var(--brand-neutral-900); --bg-surface: var(--brand-neutral-800);\n  --bg-subtle: var(--brand-neutral-950); --bg-inset: var(--brand-neutral-800);\n  --bg-inverse: var(--brand-neutral-50); --bg-field: var(--brand-neutral-800);\n  --text-primary: var(--brand-neutral-50); --text-secondary: var(--brand-neutral-300);\n  --text-tertiary: var(--brand-neutral-400); --text-placeholder: var(--brand-neutral-400);\n  --text-accent: var(--brand-accent-300); --border-default: var(--brand-neutral-700);\n  --border-strong: var(--brand-neutral-600); --border-field: var(--brand-neutral-400);\n  --border-field-hover: var(--brand-neutral-300); --border-focus: var(--brand-neutral-50);\n  --action-secondary-text: var(--brand-secondary-300); --action-secondary-border: var(--brand-secondary-400);\n  --action-secondary-hover: var(--brand-secondary-800); --action-link-hover: var(--brand-accent-300);\n  --action-link-pressed: var(--brand-accent-400); --action-primary-hover: var(--brand-primary-400);\n  --action-primary-pressed: var(--brand-primary-300); --accent-foundation: var(--brand-accent-400);\n  --accent-system: var(--brand-secondary-700);\n}\n@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg-canvas: var(--brand-neutral-900); --bg-surface: var(--brand-neutral-800); --bg-subtle: var(--brand-neutral-950); --text-primary: var(--brand-neutral-50); --text-secondary: var(--brand-neutral-300); --text-tertiary: var(--brand-neutral-400); --text-accent: var(--brand-accent-300); --border-default: var(--brand-neutral-700); --action-primary-hover: var(--brand-primary-400); --action-primary-pressed: var(--brand-primary-300); } }\n`;
}

export async function GET() {
  const settings = getSettings();
  if (settings.theme_config) {
    const theme = parsePublishedTheme(settings.theme_config);
    return cssResponse(theme ? buildPublishedCss(theme) : "/* Invalid stored theme; preserve the built-in stylesheet. */");
  }

  // If this is a palette from the first release, preserve its rendered colors
  // until the administrator deliberately republishes it with the new resolver.
  const isDefault = (Object.keys(DEFAULT_PALETTE_ANCHORS) as (keyof typeof DEFAULT_PALETTE_ANCHORS)[])
    .every((role) => settings[`theme_${role}_500`].toUpperCase() === DEFAULT_PALETTE_ANCHORS[role]);
  if (settings.theme_customized === "1" && !isDefault) return cssResponse(legacyCss(settings));
  return cssResponse("");
}
