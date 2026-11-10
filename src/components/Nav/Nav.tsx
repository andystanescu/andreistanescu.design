import { getSettings } from "@/lib/settings";
import { getNavLinks } from "@/lib/pages";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { NavClient } from "./NavClient";

// Server wrapper: reads the admin-editable nav links (Pages) and logo
// (Settings) and hands them to the client component that owns the
// scroll/menu state.
export async function Nav() {
  const settings = getSettings();
  const links = getNavLinks();
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (verifySessionToken(token)) links.push({ label: "Admin", href: "/admin" });
  return <NavClient links={links} logoIdentity={settings.logo_identity} logoImage={settings.logo_image} logoIconImage={settings.logo_icon_image} navigationStyle={settings.navigation_style} />;
}
