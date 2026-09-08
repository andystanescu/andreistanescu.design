import { getSettings } from "@/lib/settings";
import { getNavLinks } from "@/lib/pages";
import { NavClient } from "./NavClient";

// Server wrapper: reads the admin-editable nav links (Pages) and logo
// (Settings) and hands them to the client component that owns the
// scroll/menu state.
export function Nav() {
  const settings = getSettings();
  const links = getNavLinks();
  return <NavClient links={links} logoIdentity={settings.logo_identity} />;
}
