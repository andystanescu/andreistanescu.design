import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getSettings } from "@/lib/settings";
import { generateThemePalette, parsePublishedTheme } from "@/lib/themePalette";
import { DESIGN_SYSTEM_FILES } from "@/lib/designSystemManifest";
import { DesignSystem } from "./DesignSystem";
import { ArticleHero } from "@/components/insights/ArticleHero/ArticleHero";

export function DesignSystemPage({ section }: { section?: string }) {
  const settings = getSettings();
  const theme = parsePublishedTheme(settings.theme_config);
  const anchors = theme?.anchors ?? { primary: settings.theme_primary_500, secondary: settings.theme_secondary_500, accent: settings.theme_accent_500, neutral: settings.theme_neutral_500 };
  const palettes = theme?.palettes ?? { primary: generateThemePalette(anchors.primary), secondary: generateThemePalette(anchors.secondary), accent: generateThemePalette(anchors.accent), neutral: generateThemePalette(anchors.neutral) };
  const icons = readdirSync(join(process.cwd(), "public", "assets", "lattice")).filter((name) => name.endsWith(".svg")).map((name) => name.slice(0, -4)).sort();
  const sources = (DESIGN_SYSTEM_FILES[section ?? ""] ?? []).map((path) => {
    try { return { path, code: readFileSync(join(process.cwd(), path), "utf8") }; }
    catch { return { path, code: "", unavailable: true }; }
  });
  const iconSources = section === "icons" ? Object.fromEntries(icons.map((name) => [name, readFileSync(join(process.cwd(), "public", "assets", "lattice", `${name}.svg`), "utf8")])) : {};
  const articleHero = section === "layouts" ? <ArticleHero slug="example" title="A clearer way to make decisions" excerpt="A short introduction to the article." author="Example author" publishedAt="2025-01-01" dateLabel="1 Jan 2025" readingMinutes={5} /> : undefined;
  return <DesignSystem palettes={palettes} icons={icons} iconSources={iconSources} section={section} sources={sources} identity={settings.logo_identity} logoImage={settings.logo_image} logoIconImage={settings.logo_icon_image} navigationStyle={settings.navigation_style} articleHero={articleHero} />;
}
