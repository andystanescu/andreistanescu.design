import { NextRequest } from "next/server";
import { relativeRedirect } from "@/lib/relativeRedirect";
import { getSettings, publishThemeConfiguration, resetThemeConfiguration, updateSettings } from "@/lib/settings";
import { createPublishedTheme, DEFAULT_PALETTE_ANCHORS, isHexColor, type PaletteAnchors } from "@/lib/themePalette";
import { saveUploadedImage, UploadError } from "@/lib/uploads";

const LOGO_TYPES = new Set(["image/svg+xml", "image/png"]);

function redirectError(message: string) {
  return relativeRedirect(`/admin/site-identity?error=${encodeURIComponent(message)}`);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const formType = String(form.get("form_type") ?? "");

  if (formType === "branding") {
    const current = getSettings();
    const removeLogo = form.get("remove_logo") === "on";
    const removeIcon = form.get("remove_logo_icon") === "on";
    const fullLogoFile = form.get("logo_image");
    const iconFile = form.get("logo_icon_image");
    let logoImage = removeLogo ? "" : current.logo_image;
    let logoIconImage = removeIcon ? "" : current.logo_icon_image;
    for (const [file, name] of [[fullLogoFile, "full logo"], [iconFile, "icon"]] as const) {
      if (file instanceof File && file.size > 0 && !LOGO_TYPES.has(file.type)) {
        return redirectError(`Upload a PNG or SVG ${name}.`);
      }
    }
    try {
      if (fullLogoFile instanceof File && fullLogoFile.size > 0 && !removeLogo) logoImage = await saveUploadedImage(fullLogoFile);
      if (iconFile instanceof File && iconFile.size > 0 && !removeIcon) logoIconImage = await saveUploadedImage(iconFile);
    } catch (error) {
      const message = error instanceof UploadError ? error.message : "The logo files could not be uploaded.";
      return redirectError(message);
    }
    updateSettings({ logo_image: logoImage, logo_icon_image: logoIconImage });
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
    const theme = createPublishedTheme(anchors);
    publishThemeConfiguration(JSON.stringify(theme), anchors);
  } catch (error) {
    const message = error instanceof Error ? error.message : "This theme could not be resolved safely.";
    return redirectError(message);
  }
  return relativeRedirect("/admin/site-identity?saved=theme");
}
