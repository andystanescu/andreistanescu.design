import type { Metadata, Viewport } from "next";
import { createHash } from "node:crypto";
import { ScrollToTop } from "@/components/ScrollToTop/ScrollToTop";
import { PageTransition } from "@/components/PageTransition/PageTransition";
import { EngagementTracker } from "@/components/EngagementTracker/EngagementTracker";
import { FaviconTheme } from "@/components/Logo/FaviconTheme";
import { SITE_URL } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import "./globals.css";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const settings = getSettings();
  const revision = createHash("sha256").update([settings.logo_icon_image, settings.logo_icon_color_mapping, settings.theme_config, settings.theme_primary_500, settings.theme_secondary_500, settings.theme_accent_500, settings.theme_neutral_500].join("|")).digest("hex").slice(0, 12);
  const iconType = /\.svg$/i.test(settings.logo_icon_image) ? "image/svg+xml" : /\.png$/i.test(settings.logo_icon_image) ? "image/png" : "image/x-icon";
  return { metadataBase: new URL(SITE_URL), title: settings.site_meta_title, description: settings.site_meta_description, keywords: settings.homepage_meta_keywords || undefined, applicationName: settings.site_name, openGraph: { siteName: settings.site_name }, icons: settings.logo_icon_image ? { icon: [{ url: `/api/site-icon?v=${revision}`, type: iconType, ...(iconType === "image/svg+xml" ? { sizes: "any" } : {}) }] } : undefined };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const settings = getSettings();
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&amp;family=IBM+Plex+Sans:wght@500;600&amp;family=Inter:wght@400;500&amp;display=swap" />
        <link rel="stylesheet" href="/api/site-theme" />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `try{const theme=localStorage.getItem("conscept-theme");if(theme==="light"||theme==="dark"){document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}}catch{}` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "WebSite", name: settings.site_name, url: SITE_URL,
          description: settings.site_meta_description,
        }).replace(/</g, "\\u003c") }} />
        <ScrollToTop />
        <FaviconTheme />
        <EngagementTracker />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
