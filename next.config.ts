import type { NextConfig, SizeLimit } from "next";

const configuredImportLimit = process.env.CONTENT_IMPORT_MAX_BODY_SIZE?.trim();
const contentImportMaxBodySize: SizeLimit = configuredImportLimit && /^\d+(?:\.\d+)?[kKmMgG][bB]$/.test(configuredImportLimit)
  ? configuredImportLimit as SizeLimit
  : "50mb";

const nextConfig: NextConfig = {
  experimental: {
    // Content exports include base64-encoded uploaded assets. The default
    // 10 MB proxy buffer can truncate those multipart imports before the
    // route handler receives them. Hosts can raise this temporarily for a
    // large recovery import without requiring another code change.
    proxyClientMaxBodySize: contentImportMaxBodySize,
  },
};

export default nextConfig;
