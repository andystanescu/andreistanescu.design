import type { DatabaseSync } from "node:sqlite";

const SEED_SERVICE_ITEMS = [
  {
    slug: "design-systems",
    icon: "/assets/mark-design-systems.svg",
    title: "Design Systems",
    description: "Scalable systems that create consistency and accelerate teams.",
  },
  {
    slug: "product-architecture",
    icon: "/assets/mark-product-architecture.svg",
    title: "Product Architecture",
    description: "Information, flows and structures that enable clarity and growth.",
  },
  {
    slug: "ai-enabled-design-operations",
    icon: "/assets/mark-ai-design-ops.svg",
    title: "AI-Enabled Design Operations",
    description:
      "Integrating AI into workflows to unlock efficiency without losing quality.",
  },
  {
    slug: "governance-scale",
    icon: "/assets/mark-governance-scale.svg",
    title: "Governance & Scale",
    description: "Rules, processes and alignment that keep systems healthy over time.",
  },
  {
    slug: "collaboration-alignment",
    icon: "/assets/mark-collaboration-alignment.svg",
    title: "Collaboration & Alignment",
    description:
      "Bringing design, engineering and product together around shared foundations.",
  },
];

/** Seed only new installations; never recreate deliberately deleted services. */
export function seedServices(db: DatabaseSync): void {
  const insertServiceItemStmt = db.prepare(
    `INSERT INTO service_items (slug, title, description, icon, show_on_homepage, position, published)
     VALUES (?, ?, ?, ?, 1, ?, 1)`
  );
  const getServiceItemStmt = db.prepare(
    "SELECT slug FROM service_items WHERE slug = ?"
  );
  // Seed the built-in services only for a genuinely empty database. Re-adding
  // any missing seed row on every app start makes an intentional admin deletion
  // appear to undo itself after a restart or hot reload.
  const serviceCount = db
    .prepare("SELECT COUNT(*) AS count FROM service_items")
    .get() as { count: number };
  if (serviceCount.count === 0 && !db.prepare("SELECT 1 FROM settings WHERE key = ?").get("shared_categories_v1")) {
    SEED_SERVICE_ITEMS.forEach((item, index) => {
      if (!getServiceItemStmt.get(item.slug)) {
        insertServiceItemStmt.run(
          item.slug,
          item.title,
          item.description,
          item.icon,
          index
        );
      }
    });
  }
}
