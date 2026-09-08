import { db } from "@/lib/db";

export type ServiceItem = {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string;
  body: string;
  show_on_homepage: number;
  position: number;
  published: number;
  card_size: "standard" | "large";
};

export function getServiceItems(): ServiceItem[] {
  return db
    .prepare("SELECT * FROM service_items WHERE published = 1 ORDER BY position ASC")
    .all() as ServiceItem[];
}

export function getAllServiceItemsAdmin(): ServiceItem[] {
  return db
    .prepare("SELECT * FROM service_items ORDER BY position ASC")
    .all() as ServiceItem[];
}

export function getServiceItemBySlug(slug: string): ServiceItem | undefined {
  return db
    .prepare("SELECT * FROM service_items WHERE slug = ? AND published = 1")
    .get(slug) as ServiceItem | undefined;
}

export function getHomepageServiceItems(): ServiceItem[] {
  return db
    .prepare(
      "SELECT * FROM service_items WHERE published = 1 AND show_on_homepage = 1 ORDER BY position ASC"
    )
    .all() as ServiceItem[];
}
