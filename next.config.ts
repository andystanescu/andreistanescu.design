import type { NextConfig, SizeLimit } from "next";

const configuredImportLimit = process.env.CONTENT_IMPORT_MAX_BODY_SIZE?.trim();
const contentImportMaxBodySize: SizeLimit = configuredImportLimit && /^\d+(?:\.\d+)?[kKmMgG][bB]$/.test(configuredImportLimit)
  ? configuredImportLimit as SizeLimit
  : "50mb";

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/live-component-preview", headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'" }] }];
  },
  outputFileTracingIncludes: {
    "/admin/design-system/*": ["./src/components/**/*.{tsx,css}", "./src/app/globals.css", "./src/app/admin/**/admin.module.css", "./src/lib/themePalette.ts", "./public/assets/lattice/*.svg"],
    "/admin/design-system": ["./public/assets/lattice/*.svg"],
  },
  experimental: {
    // Content exports include base64-encoded uploaded assets. The default
    // 10 MB proxy buffer can truncate those multipart imports before the
    // route handler receives them. Hosts can raise this temporarily for a
    // large recovery import without requiring another code change.
    proxyClientMaxBodySize: contentImportMaxBodySize,
  },
};

export default nextConfig;
