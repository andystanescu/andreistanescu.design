export type ServiceOutcome = { title: string; description: string };
export type ServiceSectionOverrides = Record<string, { outcomes?: ServiceOutcome[]; workTitle?: string; workItems?: string[]; ctaEyebrow?: string; ctaTitle?: string; ctaDescription?: string; evidenceDescription?: string; recognitionTitle?: string; recognitionSignals?: string[] }>;

const STANDARD_OUTCOMES: ServiceOutcome[] = [
  { title: "Consistency at scale", description: "Unified experiences across products and platforms." },
  { title: "Faster delivery", description: "Reusable building blocks and clear patterns." },
  { title: "Better collaboration", description: "A shared language between design and engineering." },
  { title: "Long-term impact", description: "Systems that evolve with your product." },
];
const OUTCOMES: Record<string, ServiceOutcome[]> = {
  "ai-enabled-design-operations": [
    { title: "More capacity, safely", description: "Assistive workflows that preserve a consistent quality bar." },
    { title: "Shorter review cycles", description: "AI-supported preparation and iteration where it genuinely helps." },
    { title: "Visible human judgement", description: "Clear review points keep decisions accountable and explainable." },
    { title: "Operations that learn", description: "People review evidence and approve changes to the workflow." },
  ],
  "governance-scale": [
    { title: "Shared ownership", description: "Clear responsibilities make a system easier to trust and contribute to." },
    { title: "Lightweight decisions", description: "Principles and contribution paths reduce unnecessary debate." },
    { title: "Visible stewardship", description: "Teams know who maintains the system and how decisions are made." },
    { title: "Durable momentum", description: "Governance evolves with the organisation instead of slowing it down." },
  ],
  "collaboration-alignment": [
    { title: "Shared context", description: "Everyone is solving the same version of the problem." },
    { title: "Useful disagreement", description: "Different perspectives surface assumptions rather than creating parallel conversations." },
    { title: "Clear decisions", description: "Teams know what was decided and why." },
    { title: "Coordinated action", description: "Different disciplines can move independently without pulling in different directions." },
  ],
};

const WORK: Record<string, { title: string; items: string[] }> = {
  "design-systems": { title: "A complete design system tailored to your product, team and stage of growth.", items: ["Design system strategy and roadmap", "Information architecture and structure", "Design tokens and theming", "Component library and patterns", "Accessibility and inclusive design", "Documentation and guidelines", "Governance and adoption model"] },
  "product-architecture": { title: "A practical architecture that connects the product language, its users and the teams who evolve it.", items: ["Architectural direction and evolution strategy", "Domain and capability mapping", "Information architecture and navigation model", "End-to-end journey and service blueprint", "Content and data model alignment", "Platform and integration boundary definition", "Architecture principles and governance model"] },
  "ai-enabled-design-operations": { title: "Practical AI-enabled design operations tailored to your product, team and working culture.", items: ["AI opportunity and delegation mapping", "Workflow and operational journey mapping", "Human-in-the-loop decision design", "AI interaction and prompt patterns", "Exception handling and escalation flows", "Prototype-to-production implementation guidance", "Measurement, governance and adoption framework"] },
  "governance-scale": { title: "A governance model shaped around your products, teams and stage of scale.", items: ["Governance strategy and operating model", "Roles, responsibilities and ownership map", "Decision principles and escalation paths", "Contribution and change-management workflow", "Review cadence and quality guardrails", "Adoption measurement and reporting framework", "Evolution and stewardship model"] },
  "collaboration-alignment": { title: "An alignment practice shaped around the decisions your product and teams need to make.", items: ["Shared problem framing and success criteria", "Cross-functional decision principles", "Responsibilities and collaboration boundaries", "Decision and communication models", "Collaborative working sessions where useful", "Decision documentation and traceability", "Team rituals and ways of working"] },
};
const CTA: Record<string, { title: string; description: string }> = {
  "design-systems": { title: "Tell me where things are getting stuck.", description: "We can look at what’s creating the friction and work out where attention would make the biggest difference." },
  "product-architecture": { title: "Tell me where the product is becoming difficult to reason about.", description: "We can trace what sits underneath the complexity and work out where clearer structure would make the biggest difference." },
  "ai-enabled-design-operations": { title: "Tell me where the work is getting harder to control.", description: "We can look at where friction, repetition or uncertainty is building and work out what deserves attention first." },
  "governance-scale": { title: "Tell me where decisions are getting stuck.", description: "We can look at what’s creating the friction and work out what needs to become clearer." },
  "collaboration-alignment": { title: "Tell me what keeps coming back into the conversation.", description: "We can look at why it isn't turning into a durable decision and what would help the team move forward." },
};
const RECOGNITION: Record<string, { title: string; signals: string[] }> = {
  "design-systems": { title: "A design system may need attention when…", signals: ["The component library exists, but teams adopt it inconsistently.", "Figma and the production implementation have drifted apart.", "Teams keep rebuilding the same patterns across products.", "Documentation can no longer be trusted to describe how the system works.", "Nobody is sure who owns changes to the system.", "New products cannot use the system safely without workarounds."] },
  "product-architecture": { title: "Product architecture may need attention when…", signals: ["Journeys work independently, but they do not feel like parts of one product.", "Navigation keeps growing through exceptions and special cases.", "The same concept means different things in different areas of the product.", "Adding functionality requires changes to unrelated parts of the product.", "Teams disagree about where capabilities belong.", "Nobody can confidently explain how the whole product fits together."] },
  "ai-enabled-design-operations": { title: "The way your team works may need attention when…", signals: ["AI is already being used, but everyone uses it differently.", "Review effort is growing almost as quickly as AI-generated output.", "Teams can automate tasks, but are not sure which decisions should remain human.", "Good AI workflows exist as individual habits rather than shared practice.", "Nobody is quite sure who is accountable when AI gets something wrong.", "AI makes work faster, but quality is becoming harder to predict."] },
  "governance-scale": { title: "A system becomes harder to sustain when…", signals: ["Everyone knows something needs to change, but nobody knows who can decide.", "Small contributions require too many conversations.", "Different teams interpret the same standards differently.", "Exceptions accumulate without ever changing the underlying rule.", "The people maintaining the system have responsibility without authority.", "Decisions are made, but nobody can find out later why they were made."] },
  "collaboration-alignment": { title: "Teams can be talking constantly and still be misaligned.", signals: ["The same decision keeps resurfacing in different meetings.", "Design, product and engineering describe the same problem differently.", "Decisions are made, but different teams leave with different interpretations.", "Important context lives with individuals rather than the team.", "Work repeatedly stalls because assumptions surface too late.", "Everyone agrees in the meeting, but execution immediately starts diverging."] },
};

export function parseServiceSectionOverrides(raw: string): ServiceSectionOverrides {
  try {
    const value: unknown = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const result: ServiceSectionOverrides = {};
    for (const [template, input] of Object.entries(value)) {
      if ((template !== "custom" && !Object.hasOwn(WORK, template)) || !input || typeof input !== "object" || Array.isArray(input)) continue;
      const source = input as Record<string, unknown>;
      const item: ServiceSectionOverrides[string] = {};
      if (Array.isArray(source.outcomes) && source.outcomes.length === 4 && source.outcomes.every((entry: unknown) => !!entry && typeof entry === "object" && typeof (entry as ServiceOutcome).title === "string" && typeof (entry as ServiceOutcome).description === "string")) item.outcomes = source.outcomes.map((entry: ServiceOutcome) => ({ title: entry.title.slice(0, 200), description: entry.description.slice(0, 2000) }));
      if (typeof source.workTitle === "string") item.workTitle = source.workTitle.slice(0, 500);
      if (typeof source.ctaTitle === "string") item.ctaTitle = source.ctaTitle.slice(0, 500);
      if (typeof source.ctaDescription === "string") item.ctaDescription = source.ctaDescription.slice(0, 2000);
      if (typeof source.ctaEyebrow === "string") item.ctaEyebrow = source.ctaEyebrow.slice(0, 200);
      if (typeof source.evidenceDescription === "string") item.evidenceDescription = source.evidenceDescription.slice(0, 2000);
      if (typeof source.recognitionTitle === "string") item.recognitionTitle = source.recognitionTitle.slice(0, 500);
      if (Array.isArray(source.recognitionSignals) && source.recognitionSignals.length === 6 && source.recognitionSignals.every((entry: unknown) => typeof entry === "string")) item.recognitionSignals = source.recognitionSignals.map((entry: string) => entry.slice(0, 1000));
      if (Array.isArray(source.workItems) && source.workItems.length === 7 && source.workItems.every((entry: unknown) => typeof entry === "string")) item.workItems = source.workItems.map((entry: string) => entry.slice(0, 500));
      result[template] = item;
    }
    return result;
  } catch { return {}; }
}

export function getServiceSectionContent(template: string, overrides: ServiceSectionOverrides) {
  const saved = overrides[template] ?? {};
  const work = WORK[template] ?? WORK["design-systems"];
  const cta = CTA[template] ?? CTA["design-systems"];
  const recognition = RECOGNITION[template] ?? RECOGNITION["design-systems"];
  const evidenceDescriptions: Record<string, string> = { "product-architecture": "Selected work and thinking where product structure clarified journeys, boundaries and decisions.", "ai-enabled-design-operations": "Selected work and thinking where AI changed how work could be done without removing the judgement it still needed.", "governance-scale": "Selected work and thinking where clearer ownership, decisions and stewardship helped systems keep working as they grew.", "collaboration-alignment": "Selected work and thinking where shared understanding changed how teams made decisions and moved forward.", "design-systems": "Selected work and thinking where shared foundations, patterns and governance shaped the outcome." };
  return { outcomes: saved.outcomes ?? OUTCOMES[template] ?? STANDARD_OUTCOMES, workTitle: saved.workTitle ?? work.title, workItems: saved.workItems ?? work.items, ctaEyebrow: saved.ctaEyebrow ?? "START WITH THE FRICTION", ctaTitle: saved.ctaTitle ?? cta.title, ctaDescription: saved.ctaDescription ?? cta.description, evidenceDescription: saved.evidenceDescription ?? evidenceDescriptions[template] ?? "Selected work and thinking related to this area.", recognitionTitle: saved.recognitionTitle ?? recognition.title, recognitionSignals: saved.recognitionSignals ?? recognition.signals };
}
