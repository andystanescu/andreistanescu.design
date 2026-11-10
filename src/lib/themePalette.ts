export const THEME_TONES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ThemeTone = (typeof THEME_TONES)[number];
export type ThemePalette = Record<ThemeTone, string>;
export type PaletteRole = "primary" | "secondary" | "accent" | "neutral";
export type PaletteAnchors = Record<PaletteRole, string>;
export type ThemePalettes = Record<PaletteRole, ThemePalette>;
export type ThemeModeTokens = Record<string, string>;

export type ContrastCheck = {
  mode: "light" | "dark";
  role: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
};

export type ThemeResolution = {
  palettes: ThemePalettes;
  semantic: { light: ThemeModeTokens; dark: ThemeModeTokens };
  checks: ContrastCheck[];
  issues: string[];
};

export type PublishedTheme = {
  schemaVersion: 1;
  algorithmVersion: "oklch-1";
  anchors: PaletteAnchors;
  palettes: ThemePalettes;
  semantic: ThemeResolution["semantic"];
  checks: ContrastCheck[];
  publishedAt: string;
};

const LIGHT_STEPS = { 400: 0.12, 300: 0.27, 200: 0.46, 100: 0.68, 50: 0.88 } as const;
const DARK_STEPS = { 600: 0.12, 700: 0.26, 800: 0.44, 900: 0.66, 950: 0.84 } as const;
const GAMUT_EPSILON = 1e-7;

export const DEFAULT_PALETTE_ANCHORS: PaletteAnchors = {
  primary: "#11161F",
  secondary: "#3E4650",
  accent: "#E8441C",
  neutral: "#6B7280",
};

export function isHexColor(value: string): boolean {
  return /^#[\da-f]{6}$/i.test(value);
}

type Oklab = { l: number; a: number; b: number };
type Oklch = { l: number; c: number; h: number };

function srgbToLinear(channel: number) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number) {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

export function hexToOklab(hex: string): Oklab {
  if (!isHexColor(hex)) throw new Error("Use a six-digit hex color, such as #4567A9.");
  const r = srgbToLinear(Number.parseInt(hex.slice(1, 3), 16) / 255);
  const g = srgbToLinear(Number.parseInt(hex.slice(3, 5), 16) / 255);
  const b = srgbToLinear(Number.parseInt(hex.slice(5, 7), 16) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToLinearRgb({ l, a, b }: Oklab) {
  const lp = l + 0.3963377774 * a + 0.2158037573 * b;
  const mp = l - 0.1055613458 * a - 0.0638541728 * b;
  const sp = l - 0.0894841775 * a - 1.291485548 * b;
  const ll = lp ** 3;
  const mm = mp ** 3;
  const ss = sp ** 3;
  return [
    4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss,
    -1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss,
    -0.0041960863 * ll - 0.7034186147 * mm + 1.707614701 * ss,
  ] as const;
}

function toOklch({ l, a, b }: Oklab): Oklch {
  return { l, c: Math.hypot(a, b), h: Math.atan2(b, a) };
}

function fromOklch({ l, c, h }: Oklch): Oklab {
  return { l, a: c * Math.cos(h), b: c * Math.sin(h) };
}

function isInSrgbGamut(rgb: readonly number[]) {
  return rgb.every((channel) => channel >= -GAMUT_EPSILON && channel <= 1 + GAMUT_EPSILON);
}

function oklchToHexGamutMapped(color: Oklch) {
  let chroma = Math.max(0, color.c);
  let rgb = oklabToLinearRgb(fromOklch({ ...color, c: chroma }));
  if (!isInSrgbGamut(rgb)) {
    let low = 0;
    let high = chroma;
    for (let index = 0; index < 26; index += 1) {
      const middle = (low + high) / 2;
      const candidate = oklabToLinearRgb(fromOklch({ ...color, c: middle }));
      if (isInSrgbGamut(candidate)) low = middle;
      else high = middle;
    }
    chroma = low;
    rgb = oklabToLinearRgb(fromOklch({ ...color, c: chroma }));
  }
  const channels = rgb.map((channel) => {
    const encoded = linearToSrgb(Math.min(1, Math.max(0, channel)));
    return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
  });
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/** Deterministic OKLCH ramp. The entered 500 anchor is never changed. */
export function generateThemePalette(seed: string): ThemePalette {
  if (!isHexColor(seed)) throw new Error("Use a six-digit hex color, such as #4567A9.");
  const anchor = seed.toUpperCase();
  const base = toOklch(hexToOklab(anchor));
  const palette = { 500: anchor } as ThemePalette;

  for (const [rawTone, amount] of Object.entries(LIGHT_STEPS)) {
    const tone = Number(rawTone) as ThemeTone;
    const lightness = base.l + (1 - base.l) * amount;
    const chroma = base.c * (1 - amount * 0.38);
    palette[tone] = oklchToHexGamutMapped({ l: lightness, c: chroma, h: base.h });
  }
  for (const [rawTone, amount] of Object.entries(DARK_STEPS)) {
    const tone = Number(rawTone) as ThemeTone;
    const lightness = base.l * (1 - amount);
    const chroma = base.c * (1 - amount * 0.28);
    palette[tone] = oklchToHexGamutMapped({ l: lightness, c: chroma, h: base.h });
  }
  return palette;
}

export function perceptualDistance(left: string, right: string) {
  const a = hexToOklab(left);
  const b = hexToOklab(right);
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
}

function linearChannel(hex: string, offset: number) {
  const encoded = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return srgbToLinear(encoded);
}

export function relativeLuminance(hex: string) {
  return 0.2126 * linearChannel(hex, 1) + 0.7152 * linearChannel(hex, 3) + 0.0722 * linearChannel(hex, 5);
}

export function contrastRatio(foreground: string, background: string) {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function resolveClosestContrastShade(
  palette: ThemePalette,
  preferredTone: ThemeTone,
  backgrounds: string[],
  required: number,
) {
  return THEME_TONES
    .map((tone) => ({ tone, hex: palette[tone], distance: perceptualDistance(palette[preferredTone], palette[tone]) }))
    .filter(({ hex }) => backgrounds.every((background) => contrastRatio(hex, background) >= required))
    .sort((left, right) => left.distance - right.distance || Math.abs(left.tone - preferredTone) - Math.abs(right.tone - preferredTone) || left.tone - right.tone)[0] ?? null;
}

function choosePrimaryAction(palette: ThemePalette, neutral: ThemePalette, surface: string) {
  const foregroundOptions = [neutral[50], neutral[950]];
  for (const candidate of THEME_TONES.map((tone) => ({ tone, hex: palette[tone], distance: perceptualDistance(palette[500], palette[tone]) }))
    .sort((left, right) => left.distance - right.distance || left.tone - right.tone)) {
    const foreground = foregroundOptions
      .map((hex) => ({ hex, ratio: contrastRatio(hex, candidate.hex) }))
      .sort((left, right) => right.ratio - left.ratio)
      .find((option) => option.ratio >= 4.5 && contrastRatio(candidate.hex, surface) >= 3);
    if (foreground) return { ...candidate, foreground: foreground.hex };
  }
  return null;
}

function closestRoleColor(palette: ThemePalette, preferredTone: ThemeTone, backgrounds: string[], required: number, mode: "light" | "dark", role: string, checks: ContrastCheck[], issues: string[]) {
  const choice = resolveClosestContrastShade(palette, preferredTone, backgrounds, required);
  if (!choice) {
    issues.push(`${mode}: ${role} cannot reach ${required}:1 contrast against ${backgrounds.join(" and ")}.`);
    return palette[preferredTone];
  }
  for (const background of backgrounds) {
    checks.push({ mode, role, foreground: choice.hex, background, ratio: Number(contrastRatio(choice.hex, background).toFixed(2)), required });
  }
  return choice.hex;
}

function chooseActionStatePair(
  backgroundPalette: ThemePalette,
  foregroundPalette: ThemePalette,
  surface: string,
  preferredBackgroundTone: ThemeTone,
  preferredForegroundTone: ThemeTone,
  mode: "light" | "dark",
  role: string,
  checks: ContrastCheck[],
  issues: string[],
) {
  const choices = THEME_TONES.flatMap((backgroundTone) => {
    const background = backgroundPalette[backgroundTone];
    if (contrastRatio(background, surface) < 3) return [];
    const foregroundChoice = resolveClosestContrastShade(foregroundPalette, preferredForegroundTone, [background], 4.5);
    if (!foregroundChoice) return [];
    return [{
      backgroundTone,
      background,
      foreground: foregroundChoice.hex,
      distance: perceptualDistance(backgroundPalette[preferredBackgroundTone], background)
        + perceptualDistance(foregroundPalette[preferredForegroundTone], foregroundChoice.hex),
    }];
  }).sort((left, right) => left.distance - right.distance || left.backgroundTone - right.backgroundTone);
  const choice = choices[0];
  if (!choice) {
    issues.push(`${mode}: ${role} cannot meet 4.5:1 text contrast and 3:1 control contrast using the selected palettes.`);
    return null;
  }
  checks.push(
    { mode, role: `${role} text`, foreground: choice.foreground, background: choice.background, ratio: Number(contrastRatio(choice.foreground, choice.background).toFixed(2)), required: 4.5 },
    { mode, role: `${role} control`, foreground: choice.background, background: surface, ratio: Number(contrastRatio(choice.background, surface).toFixed(2)), required: 3 },
  );
  return choice;
}

function buildModeTokens(mode: "light" | "dark", palettes: ThemePalettes, checks: ContrastCheck[], issues: string[]): ThemeModeTokens {
  const { neutral, primary, secondary, accent } = palettes;
  const isLight = mode === "light";
  const page = neutral[isLight ? 50 : 900];
  const surface = neutral[isLight ? 50 : 800];
  const subtle = neutral[isLight ? 100 : 950];
  const field = neutral[isLight ? 50 : 800];
  const inverse = neutral[isLight ? 900 : 50];
  const primaryTarget: ThemeTone = isLight ? 900 : 50;
  const secondaryTarget: ThemeTone = isLight ? 700 : 300;
  const tertiaryTarget: ThemeTone = isLight ? 600 : 400;
  const modeBg = isLight ? neutral[50] : neutral[900];
  const actionSurface = isLight ? neutral[50] : neutral[800];

  const copySurfaces = [page, surface, subtle];
  const textPrimary = closestRoleColor(neutral, primaryTarget, copySurfaces, 4.5, mode, "primary text", checks, issues);
  const textSecondary = closestRoleColor(neutral, secondaryTarget, copySurfaces, 4.5, mode, "secondary text", checks, issues);
  const textTertiary = closestRoleColor(neutral, tertiaryTarget, copySurfaces, 4.5, mode, "muted text", checks, issues);
  const textAccent = closestRoleColor(accent, 500, copySurfaces, 4.5, mode, "accent/link text", checks, issues);
  const primaryAction = choosePrimaryAction(primary, neutral, actionSurface);
  if (!primaryAction) issues.push(`${mode}: primary action colors cannot satisfy 4.5:1 text contrast and 3:1 control contrast.`);
  const primaryActionBg = primaryAction?.hex ?? primary[500];
  const primaryActionText = primaryAction?.foreground ?? neutral[isLight ? 50 : 950];
  const primaryHover = chooseActionStatePair(accent, neutral, actionSurface, 500, primaryTarget, mode, "primary action hover", checks, issues);
  const primaryPressed = chooseActionStatePair(accent, neutral, actionSurface, isLight ? 600 : 400, primaryTarget, mode, "primary action pressed", checks, issues);
  const secondaryHover = chooseActionStatePair(primary, secondary, actionSurface, isLight ? 100 : 900, secondaryTarget, mode, "secondary action hover", checks, issues);
  const secondaryPressed = chooseActionStatePair(primary, secondary, actionSurface, isLight ? 200 : 800, secondaryTarget, mode, "secondary action pressed", checks, issues);
  const secondaryText = closestRoleColor(secondary, 500, [actionSurface], 4.5, mode, "secondary action text", checks, issues);
  const secondaryBorder = closestRoleColor(secondary, 500, [actionSurface], 3, mode, "secondary action border", checks, issues);
  const fieldBorder = closestRoleColor(neutral, 500, [field], 3, mode, "input border", checks, issues);
  const focusRing = closestRoleColor(accent, 500, [page, surface, field], 3, mode, "focus indicator", checks, issues);
  const link = textAccent;

  for (const [role, foreground, background, required] of [
    ["primary action", primaryActionText, primaryActionBg, 4.5],
    ["input text", textPrimary, field, 4.5],
    ["focus indicator", focusRing, page, 3],
  ] as const) {
    const ratio = contrastRatio(foreground, background);
    if (ratio < required) issues.push(`${mode}: ${role} is ${ratio.toFixed(2)}:1; ${required}:1 is required.`);
    else checks.push({ mode, role, foreground, background, ratio: Number(ratio.toFixed(2)), required });
  }

  const tokens: ThemeModeTokens = {
    "--bg-canvas": page,
    "--bg-surface": surface,
    "--bg-subtle": subtle,
    "--bg-inset": subtle,
    "--bg-inverse": inverse,
    "--bg-field": field,
    "--text-primary": textPrimary,
    "--text-secondary": textSecondary,
    "--text-tertiary": textTertiary,
    "--text-placeholder": textTertiary,
    "--text-accent": textAccent,
    "--border-default": neutral[isLight ? 200 : 700],
    "--border-strong": neutral[isLight ? 300 : 600],
    "--border-field": fieldBorder,
    "--border-field-hover": closestRoleColor(neutral, isLight ? 700 : 300, [field], 3, mode, "hovered input border", checks, issues),
    "--border-focus": focusRing,
    "--action-primary-bg": primaryActionBg,
    "--action-primary-text": primaryActionText,
    "--action-primary-hover": primaryHover?.background ?? accent[500],
    "--action-primary-hover-text": primaryHover?.foreground ?? neutral[primaryTarget],
    "--action-primary-pressed": primaryPressed?.background ?? accent[500],
    "--action-primary-pressed-text": primaryPressed?.foreground ?? neutral[primaryTarget],
    "--action-secondary-bg": actionSurface,
    "--action-secondary-text": secondaryText,
    "--action-secondary-border": secondaryBorder,
    "--action-secondary-hover": secondaryHover?.background ?? primary[isLight ? 100 : 900],
    "--action-secondary-hover-text": secondaryHover?.foreground ?? secondary[secondaryTarget],
    "--action-secondary-hover-border": secondaryHover?.foreground ?? secondaryBorder,
    "--action-secondary-pressed": secondaryPressed?.background ?? primary[isLight ? 200 : 800],
    "--action-secondary-pressed-text": secondaryPressed?.foreground ?? secondary[secondaryTarget],
    "--action-secondary-pressed-border": secondaryPressed?.foreground ?? secondaryBorder,
    "--action-tertiary-bg": subtle,
    "--action-tertiary-text": textPrimary,
    "--action-tertiary-border": neutral[isLight ? 400 : 600],
    "--action-tertiary-hover": neutral[isLight ? 200 : 700],
    "--action-tertiary-pressed": neutral[isLight ? 300 : 600],
    "--action-ghost-hover": subtle,
    "--action-ghost-pressed": neutral[isLight ? 200 : 700],
    "--action-link-text": link,
    "--action-link-hover": link,
    "--action-link-pressed": closestRoleColor(accent, 500, [page, surface], 4.5, mode, "pressed link", checks, issues),
    "--accent-foundation": accent[500],
    "--accent-system": secondary[isLight ? 300 : 700],
  };
  // These two values are already accessible against the chosen surface and are
  // recorded explicitly so the published theme includes the actual pairs.
  const linkRatio = contrastRatio(link, modeBg);
  if (linkRatio >= 4.5) checks.push({ mode, role: "text link", foreground: link, background: modeBg, ratio: Number(linkRatio.toFixed(2)), required: 4.5 });
  return tokens;
}

export function resolveTheme(anchors: PaletteAnchors): ThemeResolution {
  for (const role of ["primary", "secondary", "accent", "neutral"] as const) {
    if (!isHexColor(anchors[role])) throw new Error(`${role} must be a six-digit hex color.`);
  }
  const palettes = {
    primary: generateThemePalette(anchors.primary),
    secondary: generateThemePalette(anchors.secondary),
    accent: generateThemePalette(anchors.accent),
    neutral: generateThemePalette(anchors.neutral),
  };
  const checks: ContrastCheck[] = [];
  const issues: string[] = [];
  return {
    palettes,
    semantic: {
      light: buildModeTokens("light", palettes, checks, issues),
      dark: buildModeTokens("dark", palettes, checks, issues),
    },
    checks,
    issues: [...new Set(issues)],
  };
}

export function createPublishedTheme(anchors: PaletteAnchors, publishedAt = new Date().toISOString()): PublishedTheme {
  const resolution = resolveTheme(anchors);
  if (resolution.issues.length) throw new Error(resolution.issues.join(" "));
  return {
    schemaVersion: 1,
    algorithmVersion: "oklch-1",
    anchors: Object.fromEntries(Object.entries(anchors).map(([role, color]) => [role, color.toUpperCase()])) as PaletteAnchors,
    palettes: resolution.palettes,
    semantic: resolution.semantic,
    checks: resolution.checks,
    publishedAt,
  };
}

export function parsePublishedTheme(value: string): PublishedTheme | null {
  try {
    const parsed = JSON.parse(value) as PublishedTheme;
    if (parsed.schemaVersion !== 1 || parsed.algorithmVersion !== "oklch-1" || !parsed.anchors || !parsed.palettes || !parsed.semantic) return null;
    const roles: PaletteRole[] = ["primary", "secondary", "accent", "neutral"];
    for (const role of roles) {
      if (!isHexColor(parsed.anchors[role])) return null;
      for (const tone of THEME_TONES) if (!isHexColor(parsed.palettes[role]?.[tone])) return null;
    }
    for (const mode of ["light", "dark"] as const) {
      for (const [token, color] of Object.entries(parsed.semantic[mode] ?? {})) {
        if (!/^--[a-z-]+$/.test(token) || !isHexColor(color)) return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}
