import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Inter } from "next/font/google";
import { ScrollToTop } from "@/components/ScrollToTop/ScrollToTop";
import { PageTransition } from "@/components/PageTransition/PageTransition";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ConScept — Design systems, product architecture, AI-enabled design operations",
  description:
    "ConScept helps growing technology companies build the systems behind their products: design system architecture, product architecture, and AI-enabled design operations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${inter.variable}`}
    >
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "WebSite", name: "Andrei Stanescu", url: SITE_URL,
          description: "Design systems, product architecture and AI-enabled design operations.",
        }) }} />
        <ScrollToTop />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
