import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Content exports include base64-encoded uploaded assets. The default
    // 10 MB proxy buffer can truncate those multipart imports before the
    // route handler receives them.
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
