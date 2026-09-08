import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { getPublishedPage } from "@/lib/pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const corePaths = ["", "about", "services", "approach", "work", "insights", "contact"];
  const legalPaths = ["privacy", "terms"].filter((path) => getPublishedPage(path));
  const urls: MetadataRoute.Sitemap = [...corePaths, ...legalPaths].map((path) => ({ url: `${SITE_URL}/${path}` }));
  const services = db.prepare("SELECT slug FROM service_items WHERE published = 1").all() as { slug: string }[];
  const insights = db.prepare("SELECT slug FROM insights WHERE published = 1").all() as { slug: string }[];
  const studies = db.prepare("SELECT slug FROM case_studies WHERE published = 1 AND password_required = 0").all() as { slug: string }[];
  urls.push(...services.map(({ slug }) => ({ url: `${SITE_URL}/services/${encodeURIComponent(slug)}` })));
  urls.push(...insights.map(({ slug }) => ({ url: `${SITE_URL}/insights/${encodeURIComponent(slug)}` })));
  urls.push(...studies.map(({ slug }) => ({ url: `${SITE_URL}/work/${encodeURIComponent(slug)}` })));
  return urls;
}
