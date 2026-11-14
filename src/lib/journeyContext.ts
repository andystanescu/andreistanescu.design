/** Keep only a country-level provider value; unknown or malformed values stay unavailable. */
export function normalizeJourneyCountry(value: string | null | undefined): string {
  const code = (value || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || ["XX", "ZZ", "AA"].includes(code)) return "";
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) === code ? "" : code; } catch { return ""; }
}

export function journeyCountryFromHeaders(headers: Headers): string {
  for (const name of ["cf-ipcountry", "x-vercel-ip-country", "x-country"]) {
    const code = normalizeJourneyCountry(headers.get(name));
    if (code) return code;
  }
  return "";
}

/** Only source labels or a bare referring hostname are retained, never full URLs. */
export function normalizeJourneySource(value: string): string {
  if (["Direct", "Google", "LinkedIn", "Other sources"].includes(value)) return value;
  const source = value.trim().toLowerCase();
  return source.length <= 100 && /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(source) && source.includes(".") ? source : "Other sources";
}

export function displayJourneyCountry(value: string | null | undefined): string {
  const code = normalizeJourneyCountry(value);
  if (!code) return "Country unavailable";
  try { return new Intl.DisplayNames(["en-GB"], { type: "region" }).of(code) || "Country unavailable"; } catch { return "Country unavailable"; }
}
