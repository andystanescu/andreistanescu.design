import { readFile } from "fs/promises";
import { basename, extname, join } from "path";
import { getSettings } from "@/lib/settings";
import { getUploadsDir } from "@/lib/uploads";
import { parseLogoColorMapping, recolorLogoSvg } from "@/lib/logoColors";
import { parsePublishedTheme, resolveTheme } from "@/lib/themePalette";

export async function mappedLogo(variant: "full" | "icon", mode: "light" | "dark") {
  const settings = getSettings();
  const url = variant === "full" ? settings.logo_image : settings.logo_icon_image;
  const name = basename(url);
  if (!url.startsWith("/uploads/") || !/^[\da-f-]+\.(png|svg)$/i.test(name)) return null;
  try {
    const bytes = await readFile(join(getUploadsDir(), name));
    if (extname(name).toLowerCase() !== ".svg") return { body: new Uint8Array(bytes), type: "image/png" };
    const published = parsePublishedTheme(settings.theme_config);
    const palettes = published?.palettes ?? resolveTheme({primary: settings.theme_primary_500, secondary: settings.theme_secondary_500, accent: settings.theme_accent_500, neutral: settings.theme_neutral_500}).palettes;
    const mapping = parseLogoColorMapping(variant === "full" ? settings.logo_color_mapping : settings.logo_icon_color_mapping);
    return { body: recolorLogoSvg(bytes.toString("utf8"), mapping[mode], palettes), type: "image/svg+xml" };
  } catch { return null; }
}

export const LOGO_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
};
