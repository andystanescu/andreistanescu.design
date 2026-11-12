import type { Metadata, Viewport } from "next";
import { ScrollToTop } from "@/components/ScrollToTop/ScrollToTop";
import { PageTransition } from "@/components/PageTransition/PageTransition";
import { EngagementTracker } from "@/components/EngagementTracker/EngagementTracker";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ConScept — Design systems, product architecture, AI-enabled design operations",
  description:
    "ConScept helps growing technology companies build the systems behind their products: design system architecture, product architecture, and AI-enabled design operations.",
  icons: { icon: "/api/site-icon" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
          "@context": "https://schema.org", "@type": "WebSite", name: "Andrei Stanescu", url: SITE_URL,
          description: "Design systems, product architecture and AI-enabled design operations.",
        }) }} />
        <ScrollToTop />
        <EngagementTracker />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
