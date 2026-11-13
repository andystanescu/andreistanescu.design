import { NextRequest } from "next/server";
import { relativeRedirect } from "@/lib/relativeRedirect";
import { getSettings, publishThemeConfiguration, resetThemeConfiguration, updateSettings } from "@/lib/settings";
import { createPublishedTheme, DEFAULT_PALETTE_ANCHORS, isHexColor, parseThemeOverrides, type PaletteAnchors } from "@/lib/themePalette";
import { saveUploadedImage, UploadError } from "@/lib/uploads";
import { parseLogoColorMapping } from "@/lib/logoColors";

const LOGO_TYPES = new Set(["image/svg+xml", "image/png"]);

function redirectError(message: string) {
  return relativeRedirect(`/admin/site-identity?error=${encodeURIComponent(message)}`);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const formType = String(form.get("form_type") ?? "");

  if (formType === "details") {
    const authorName = String(form.get("author_name") ?? "").trim();
    if (!authorName || authorName.length > 120) return redirectError("Enter an author name of up to 120 characters.");
    updateSettings({ author_name: authorName });
    return relativeRedirect("/admin/site-identity?saved=details");
  }

  if (formType === "branding") {
    const current = getSettings();
    const fullLogoFile = form.get("logo_image");
    const iconFile = form.get("logo_icon_image");
    let logoImage = current.logo_image;
    let logoIconImage = current.logo_icon_image;
    for (const [file, name] of [[fullLogoFile, "full logo"], [iconFile, "icon"]] as const) {
      if (file instanceof File && file.size > 0 && !LOGO_TYPES.has(file.type)) {
        return redirectError(`Upload a PNG or SVG ${name}.`);
      }
    }
    try {
      if (fullLogoFile instanceof File && fullLogoFile.size > 0) logoImage = await saveUploadedImage(fullLogoFile);
      if (iconFile instanceof File && iconFile.size > 0) logoIconImage = await saveUploadedImage(iconFile);
    } catch (error) {
      const message = error instanceof UploadError ? error.message : "The logo files could not be uploaded.";
      return redirectError(message);
    }
    updateSettings({
      logo_image: logoImage, logo_icon_image: logoIconImage,
      logo_color_mapping: !logoImage.toLowerCase().endsWith(".svg") ? "{}" : JSON.stringify(parseLogoColorMapping(String(form.get("logo_color_mapping") ?? current.logo_color_mapping))),
      logo_icon_color_mapping: !logoIconImage.toLowerCase().endsWith(".svg") ? "{}" : JSON.stringify(parseLogoColorMapping(String(form.get("logo_icon_color_mapping") ?? current.logo_icon_color_mapping))),
    });
    return relativeRedirect("/admin/site-identity?saved=branding");
  }

  if (formType !== "theme") return redirectError("The submitted site identity form was not recognised.");

  if (form.get("theme_action") === "reset") {
    resetThemeConfiguration(DEFAULT_PALETTE_ANCHORS);
    return relativeRedirect("/admin/site-identity?saved=reset");
  }

  const anchors: PaletteAnchors = {
    primary: String(form.get("theme_primary_500") ?? "").trim().toUpperCase(),
    secondary: String(form.get("theme_secondary_500") ?? "").trim().toUpperCase(),
    accent: String(form.get("theme_accent_500") ?? "").trim().toUpperCase(),
    neutral: String(form.get("theme_neutral_500") ?? "").trim().toUpperCase(),
  };
  const invalidRole = (Object.entries(anchors) as [keyof PaletteAnchors, string][]).find(([, color]) => !isHexColor(color))?.[0];
  if (invalidRole) return redirectError(`${invalidRole[0].toUpperCase()}${invalidRole.slice(1)} must use a six-digit hex code.`);

  try {
    const overrides = parseThemeOverrides(JSON.parse(String(form.get("theme_overrides") ?? '{"light":{},"dark":{}}')));
    const theme = createPublishedTheme(anchors, undefined, overrides);
    publishThemeConfiguration(JSON.stringify(theme), anchors);
  } catch (error) {
    const message = error instanceof Error ? error.message : "This theme could not be resolved safely.";
    return redirectError(message);
  }
  return relativeRedirect("/admin/site-identity?saved=theme");
}
