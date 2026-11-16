/** Services is enabled by default for existing installations. Set SERVICES_ADDON_ENABLED=false for Core-only mode. */
export function servicesAvailable(): boolean {
  return !["false", "0", "off"].includes((process.env.SERVICES_ADDON_ENABLED ?? "true").trim().toLowerCase());
}

/** Insights remains enabled for existing sites; Core-only installations may disable it. */
export function insightsAvailable(): boolean {
  return !["false", "0", "off"].includes((process.env.INSIGHTS_ADDON_ENABLED ?? "true").trim().toLowerCase());
}

/** Whether a configurable homepage link points to an available optional section or route. */
export function homepageDestinationAvailable(href: string): boolean {
  const value = href.trim();
  if (!value || (!value.startsWith("/") && !value.startsWith("#")) || value.startsWith("//")) return true;
  const destination = new URL(value, "https://portfolio.invalid/");
  if (!servicesAvailable() && (/^\/services(?:\/|$)/i.test(destination.pathname) || (destination.pathname === "/" && destination.hash.toLowerCase() === "#services"))) return false;
  if (!insightsAvailable() && /^\/insights(?:\/|$)/i.test(destination.pathname)) return false;
  return true;
}
