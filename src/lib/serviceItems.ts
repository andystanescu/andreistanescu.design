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
  category_id: number;
  service_enabled: number;
  template_key: string;
  hero_lead: string;
  hero_description: string;
  section_content: string;
  section_settings: string;
};

export const SERVICE_TEMPLATES = [
  ["custom", "Default"],
  ["design-systems", "Ecosystem"],
  ["product-architecture", "Landscape"],
  ["ai-enabled-design-operations", "Workflow"],
  ["governance-scale", "Decision paths"],
  ["collaboration-alignment", "Convergence"],
] as const;

export function getServiceTemplate(service: Pick<ServiceItem, "template_key" | "slug">): string {
  return SERVICE_TEMPLATES.some(([key]) => key === service.template_key)
    ? service.template_key
    : SERVICE_TEMPLATES.some(([key]) => key === service.slug) ? service.slug : "custom";
}

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
    .prepare("SELECT s.*, c.name AS title FROM service_items s JOIN categories c ON c.id = s.category_id WHERE s.published = 1 AND s.service_enabled = 1 ORDER BY s.position ASC")
    .all() as ServiceItem[];
}

export function getAllServiceItemsAdmin(): ServiceItem[] {
  return db
    .prepare("SELECT * FROM service_items ORDER BY position ASC")
    .all() as ServiceItem[];
}

export function getServiceItemBySlug(slug: string): ServiceItem | undefined {
  return db
    .prepare("SELECT s.*, c.name AS title FROM service_items s JOIN categories c ON c.id = s.category_id WHERE s.slug = ? AND s.published = 1 AND s.service_enabled = 1")
    .get(slug) as ServiceItem | undefined;
}

export function getHomepageServiceItems(): ServiceItem[] {
  return db
    .prepare(
      "SELECT s.*, c.name AS title FROM service_items s JOIN categories c ON c.id = s.category_id WHERE s.published = 1 AND s.service_enabled = 1 AND s.show_on_homepage = 1 ORDER BY s.position ASC"
    )
    .all() as ServiceItem[];
}
