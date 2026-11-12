const HERO_COPY: Record<string, { lead: string; description: string }> = {
  "design-systems": { lead: "Build scalable, consistent and adaptable systems that drive better products.", description: "A design system is more than a component library: it is the shared language, principles and governance that connect how teams design, build and evolve products." },
  "product-architecture": { lead: "Shape the structure behind complex products so teams can make better decisions, faster.", description: "I clarify domains, journeys and system boundaries so the product can scale without accumulating avoidable complexity." },
  "ai-enabled-design-operations": { lead: "Give AI more responsibility without giving up control.", description: "Put AI to work inside real design and product workflows, with clear boundaries for what it can decide alone and what still needs a person’s judgement." },
  "governance-scale": { lead: "Help good systems survive growth.", description: "Clear ownership, standards and a process for exceptions, so a system stays trustworthy as more teams start depending on it, not just at launch." },
  "collaboration-alignment": { lead: "Turn different perspectives into shared direction.", description: "Create enough shared context for product, design and engineering to challenge ideas, make decisions and move forward without repeatedly reopening the same questions. Alignment does not mean everyone agrees; it means understanding what was decided, why, and what happens next." },
};

export function getServiceHeroCopy(template: string, fallbackDescription: string) {
  return HERO_COPY[template] ?? { lead: fallbackDescription, description: "" };
}
