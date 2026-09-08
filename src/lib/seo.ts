import type { Metadata } from "next";

export const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://andreistanescu.design").replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
}

export function plainText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function seoDescription(value: string, fallback: string) {
  const text = plainText(value) || fallback;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
}

export function contentMetadata(input: { title: string; description: string; path: string; image?: string; noIndex?: boolean; keywords?: string; canonicalUrl?: string }): Metadata {
  const url = input.canonicalUrl || absoluteUrl(input.path);
  const description = seoDescription(input.description, input.title);
  const image = input.image ? absoluteUrl(input.image) : undefined;
  return {
    title: input.title,
    description,
    keywords: input.keywords || undefined,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: { type: "website", url, title: input.title, description, images: image ? [{ url: image }] : [] },
    twitter: { card: image ? "summary_large_image" : "summary", title: input.title, description, images: image ? [image] : [] },
  };
}

export function pageMetadata(page: { title: string; body: string; meta_title?: string; meta_description?: string; meta_keywords?: string; canonical_url?: string; og_image?: string; no_index?: number }, path: string): Metadata {
  return contentMetadata({ title: page.meta_title || page.title, description: page.meta_description || page.body, path, image: page.og_image, keywords: page.meta_keywords, canonicalUrl: page.canonical_url || undefined, noIndex: Boolean(page.no_index) });
}
