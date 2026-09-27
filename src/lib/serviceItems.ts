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

const SERVICE_CAPABILITIES: Record<string, string[]> = {
  "design-systems": ["Strategy & roadmap", "Tokens & components", "Documentation", "Governance & adoption"],
  "product-architecture": ["Domain mapping", "Information architecture", "Journey mapping", "Architecture principles"],
  "ai-enabled-design-operations": ["Workflow automation", "AI interaction patterns", "Human-in-the-loop design", "Quality assurance"],
  "governance-scale": ["Operating model", "Ownership mapping", "Contribution workflows", "Adoption measurement"],
  "collaboration-alignment": ["Stakeholder alignment", "Decision frameworks", "Working sessions", "Team rituals"],
};

export function getServiceCapabilities(slug: string): string[] {
  return SERVICE_CAPABILITIES[slug] ?? [];
}

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
