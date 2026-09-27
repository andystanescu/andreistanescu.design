import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { BackButton } from "@/components/BackButton/BackButton";
import { LatticeBenefitIcon } from "@/components/services/LatticeBenefitIcon/LatticeBenefitIcon";
import { DesignSystemGraphic } from "@/components/services/DesignSystemGraphic/DesignSystemGraphic";
import { AiOperationsGraphic } from "@/components/services/AiOperationsGraphic/AiOperationsGraphic";
import { GovernanceScaleGraphic } from "@/components/services/GovernanceScaleGraphic/GovernanceScaleGraphic";
import { CollaborationAlignmentGraphic } from "@/components/services/CollaborationAlignmentGraphic/CollaborationAlignmentGraphic";
import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";
import { getCaseStudies } from "@/data/caseStudies";
import { getInsights } from "@/data/insights";
import { calculateReadingTime } from "@/lib/readingTime";
import { getServiceItemBySlug } from "@/lib/serviceItems";
import styles from "./service-detail.module.css";
import type { Metadata } from "next";
import { contentMetadata, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceItemBySlug(slug);
  if (!service) return {};
  return contentMetadata({ title: `${service.title} | Andrei Stanescu`, description: service.description, path: `/services/${encodeURIComponent(service.slug)}` });
}

const benefits = [["Consistency at scale", "Unified experiences across products and platforms."], ["Faster delivery", "Reusable building blocks and clear patterns."], ["Better collaboration", "A shared language between design and engineering."], ["Long-term impact", "Systems that evolve with your product."]];
const aiOperationsBenefits = [["More capacity, safely", "Assistive workflows that preserve a consistent quality bar."], ["Shorter review cycles", "AI-supported preparation and iteration where it genuinely helps."], ["Visible human judgement", "Clear review points keep decisions accountable and explainable."], ["Operations that learn", "Workflows improve as your team gathers evidence and feedback."]];
const governanceScaleBenefits = [["Shared ownership", "Clear responsibilities make a system easier to trust and contribute to."], ["Lightweight decisions", "Principles and contribution paths reduce unnecessary debate."], ["Visible stewardship", "Teams know who maintains the system and how decisions are made."], ["Durable momentum", "Governance evolves with the organisation instead of slowing it down."]];
const collaborationAlignmentBenefits = [["Shared ownership", "Clear responsibilities make a system easier to trust and contribute to."], ["Lightweight decisions", "Principles and contribution paths reduce unnecessary debate."], ["Visible stewardship", "Teams know who maintains the system and how decisions are made."], ["Durable momentum", "Governance evolves with the organisation instead of slowing it down."]];
const steps = [["01", "Discover", "Understand your product, users and team."], ["02", "Define", "Establish the principles, tokens and structure."], ["03", "Design", "Craft components, patterns and guidelines."], ["04", "Build", "Work with your team to implement and integrate."], ["05", "Evolve", "Measure, iterate and help the system grow."]];
const designSystemApproachSteps = [
  ["01", "Overall discovery", "BROAD VIEW", "Understand the product landscape, teams, constraints and existing system as a whole."],
  ["02", "Opportunity landscape", "MAP", "Make friction, inconsistency, risk and areas of leverage visible across the system."],
  ["03", "Prioritise", "FOCUS", "Choose the opportunity where action can create the clearest and most useful value."],
  ["04", "Deep discovery", "ACTIVE OPPORTUNITY", "Investigate the selected opportunity with focused evidence before committing to a solution."],
  ["05", "Decide", "DIRECTION", "Align on the response, scope, principles and evidence that will define success."],
  ["06", "Execute", "DELIVERY", "Build, integrate and support the change within the real product and team context."],
  ["07", "Learn", "EVIDENCE", "Observe adoption and outcomes, then capture what the work reveals about the wider system."],
  ["08", "Reprioritise", "NEXT CYCLE", "Return new evidence to the opportunity landscape and choose where to go next."],
] as const;
const productArchitectureApproachStages = [
  ["01", "LANDSCAPE", "Bring the whole product into view.", [["01", "Overall discovery", "Map products, users, journeys, domains and constraints."]]],
  ["02", "PRIORITY AREA", "Find where structure is creating the most friction.", [["02", "Identify opportunities", "Make structural tensions and areas of leverage visible."], ["03", "Prioritise", "Choose the problem where focused work can make the biggest difference."]]],
  ["03", "FOCUSED INVESTIGATION", "Zoom in before deciding what to change.", [["04", "Deep discovery", "Investigate the active structural problem with focused evidence."], ["05", "Decide", "Agree the boundaries, response and evidence for success."]]],
  ["04", "INTERVENTION", "Change the structure in its real product context.", [["06", "Execute", "Put the decision into practice across journeys, systems and teams."]]],
  ["05", "UPDATED LANDSCAPE", "Learn from the change and choose what deserves attention next.", [["07", "Learn", "Observe what changed and what the product reveals."], ["08", "Reprioritise", "Return learning to the opportunity landscape and begin the next cycle."]]],
] as const;
const audiences = [["01", "Growing product teams", "Bring consistency to a product portfolio that is expanding faster than the system behind it."], ["02", "Design & engineering leads", "Align decisions, ownership and implementation around one shared product language."], ["03", "Organisations in transition", "Turn fragmented patterns into a durable foundation for the next stage of growth."]];
const designSystemRecognition = [
  "The component library exists, but teams adopt it inconsistently.",
  "Figma and the production implementation have drifted apart.",
  "Teams keep rebuilding the same patterns across products.",
  "Documentation can no longer be trusted to describe how the system works.",
  "Nobody is sure who owns changes to the system.",
  "New products cannot use the system safely without workarounds.",
];
const productArchitectureRecognition = [
  "Journeys work independently, but they do not feel like parts of one product.",
  "Navigation keeps growing through exceptions and special cases.",
  "The same concept means different things in different areas of the product.",
  "Adding functionality requires changes to unrelated parts of the product.",
  "Teams disagree about where capabilities belong.",
  "Nobody can confidently explain how the whole product fits together.",
];
const defaultDeliverables = ["Design system strategy and roadmap", "Information architecture and structure", "Design tokens and theming", "Component library and patterns", "Accessibility and inclusive design", "Documentation and guidelines", "Governance and adoption model"];
const aiOperationsDeliverables = ["AI opportunity and automation roadmap", "Workflow and operational journey mapping", "Human-in-the-loop decision design", "AI interaction and prompt patterns", "Exception handling and escalation flows", "Prototype-to-production implementation guidance", "Measurement, governance and adoption framework"];
const governanceScaleDeliverables = ["Governance strategy and operating model", "Roles, responsibilities and ownership map", "Decision principles and escalation paths", "Contribution and change-management workflow", "Review cadence and quality guardrails", "Adoption measurement and reporting framework", "Long-term evolution and stewardship roadmap"];
const collaborationAlignmentDeliverables = ["Stakeholder alignment and working-session plan", "Shared vision, principles and success criteria", "Cross-functional decision framework", "Roles, responsibilities and handoff model", "Collaborative journey and workshop outputs", "Communication and decision documentation", "Team rituals and alignment playbook"];

const productArchitecture = {
  eyebrow: "PRODUCT ARCHITECTURE",
  lead: "Shape the structure behind complex products so teams can make better decisions, faster.",
  description: "I clarify domains, journeys and system boundaries so the product can scale without accumulating avoidable complexity.",
  benefits,
  deliverablesIntro: "A practical architecture that connects the product language, its users and the teams who evolve it.",
  deliverables: ["Architectural direction and evolution strategy", "Domain and capability mapping", "Information architecture and navigation model", "End-to-end journey and service blueprint", "Content and data model alignment", "Platform and integration boundary definition", "Architecture principles and governance model"],
  approachTitle: "Start with the whole product. Focus where structure matters most.",
  audienceTitle: "A structure for products at a turning point.",
  audienceLead: "Whether you are shaping a new product or untangling an existing one, I make the underlying relationships clear enough for teams to move with confidence."
};

function ProductArchitectureGraphic() {
  const territories = [
    ["01", "Users", "Needs, behaviours and journeys"],
    ["02", "Domains", "Capabilities, rules and ownership"],
    ["03", "Surfaces", "Products, services and interactions"],
    ["04", "Teams", "Responsibilities and delivery"],
  ];

  return <figure className={styles.architectureGraphic} aria-label="Product Architecture Cohesion Model">
    <figcaption className={styles.architectureHeader}><span>PRODUCT ARCHITECTURE</span><span>COHESION MODEL</span></figcaption>
    <div className={styles.architectureMap}>
      <ol className={styles.architectureTerritories}>
        {territories.map(([number, title, description]) => <li className={styles.architectureTerritory} key={number}>
          <span className={styles.architectureNumber}>{number}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </li>)}
      </ol>
      <p className={styles.architectureLanguage}>Shared Product Language</p>
      <p className={styles.architectureBoundaryLabel}>BOUNDARY</p>
    </div>
    <p className={styles.architectureFooter}><span>DECISIONS CONNECT CONTEXT, STRUCTURE, EXPERIENCE AND DELIVERY</span><span aria-hidden="true">↗</span></p>
  </figure>;
}

function ProductArchitectureTransformation() {
  const symptoms = ["Disconnected journeys", "Duplicated concepts", "Navigation exceptions", "Conflicting terminology"];
  const outcomes = ["Shared boundaries", "Shared vocabulary", "Coherent journeys", "Clearer decisions"];

  return <ServiceSection labelledBy="service-transformation-title" width="wide" className={styles.architectureTransformation}>
    <ServiceSectionHeader
      eyebrow="ARCHITECTURE TRANSFORMATION"
      title="Different symptoms can share the same structural cause."
      description="When the underlying product structure is unclear, friction appears across journeys, language and decisions."
      titleId="service-transformation-title"
      className={styles.architectureTransformationHeader}
      descriptionClassName={styles.architectureTransformationLead}
    />
    <div className={styles.transformationFlow}>
      <div className={styles.transformationStage}>
        <p className={styles.transformationLabel}>WHAT PEOPLE EXPERIENCE</p>
        <ul>{symptoms.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <span className={styles.transformationArrow} aria-hidden="true">↓</span>
      <div className={styles.transformationCore}>
        <span>THE SHARED CAUSE</span>
        <strong>Underlying product structure</strong>
      </div>
      <span className={styles.transformationArrow} aria-hidden="true">↓</span>
      <div className={styles.transformationStage}>
        <p className={styles.transformationLabel}>WHAT BECOMES POSSIBLE</p>
        <ul>{outcomes.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  </ServiceSection>;
}

function DesignSystemApproach() {
  return <ServiceSection labelledBy="service-approach-title" className={`${styles.approach} ${styles.designSystemApproach}`}>
    <ServiceSectionHeader
      eyebrow="APPROACH"
      title="Understand broadly. Go deep where action becomes useful."
      description="Map the whole system, focus on the most valuable active opportunity, then use what the work reveals to shape the next priority."
      titleId="service-approach-title"
      className={styles.designSystemApproachHeader}
      descriptionClassName={styles.designSystemApproachLead}
    />
    <div className={styles.designSystemApproachCycle}>
      <ol className={styles.designSystemApproachGrid}>
        {designSystemApproachSteps.map(([number, title, phase, description]) => <li key={number} className={styles.designSystemApproachStep}>
          <div className={styles.designSystemApproachMeta}><span>{number}</span><span>{phase}</span></div>
          <h3>{title}</h3>
          <p>{description}</p>
        </li>)}
      </ol>
      <p className={styles.designSystemApproachReturn}><span aria-hidden="true">↺</span> Learning returns to the opportunity landscape and begins the next cycle.</p>
    </div>
  </ServiceSection>;
}

function ProductArchitectureApproach() {
  return <ServiceSection labelledBy="service-approach-title" width="wide" className={`${styles.approach} ${styles.productArchitectureApproach}`}>
    <ServiceSectionHeader
      eyebrow="APPROACH"
      title="Start with the whole product. Focus where structure matters most."
      description="Move from broad context into evidence-led investigation, then carry what you learn back into the map."
      titleId="service-approach-title"
      className={styles.productArchitectureApproachHeader}
      descriptionClassName={styles.productArchitectureApproachLead}
    />
    <ol className={styles.architectureApproachStages}>
      {productArchitectureApproachStages.map(([number, phase, summary, activities]) => <li className={styles.architectureApproachStage} key={number}>
        <div className={styles.architectureApproachPhase}><span>{number}</span><span>{phase}</span></div>
        <p className={styles.architectureApproachSummary}>{summary}</p>
        <ol className={styles.architectureApproachActivities}>
          {activities.map(([step, title, description]) => <li key={step}>
            <span>{step}</span>
            <div><h3>{title}</h3><p>{description}</p></div>
          </li>)}
        </ol>
      </li>)}
    </ol>
    <p className={styles.architectureApproachReturn}><span aria-hidden="true">↺</span> Learning updates the landscape, so the next investigation starts with better context.</p>
  </ServiceSection>;
}

function DesignSystemEcosystem() {
  return <ServiceSection labelledBy="service-ecosystem-title" className={styles.designSystemEcosystem}>
    <ServiceSectionHeader
      eyebrow="ECOSYSTEM"
      title="A system works when every layer supports the next."
      description="Foundations set the rules. Tokens, components and patterns make them usable, while guidance and governance help the system stay coherent as it grows."
      titleId="service-ecosystem-title"
      className={styles.designSystemEcosystemHeader}
    />
    <div className={`layout-visual ${styles.designSystemEcosystemVisual}`}>
      <DesignSystemGraphic />
    </div>
  </ServiceSection>;
}

function normalizeCategory(value: string) {
  return value.toLocaleLowerCase("en-GB").replace(/[^a-z0-9]+/g, " ").trim();
}

function publishedTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

type EvidenceItem = {
  type: "case-study" | "article";
  title: string;
  description: string;
  metadata: string;
  href: string;
};

function ServiceEvidence({ categoryName, title, description }: { categoryName: string; title: string; description: string }) {
  const category = normalizeCategory(categoryName);
  const evidence: Array<{ publishedAt: string; id: number; item: EvidenceItem }> = [
    ...getCaseStudies()
      .filter((study) => normalizeCategory(study.category) === category)
      .map((study) => ({
        publishedAt: study.published_at,
        id: study.id,
        item: { type: "case-study" as const, title: study.title, description: study.description, metadata: study.year, href: `/work/${encodeURIComponent(study.slug)}` },
      })),
    ...getInsights()
      .filter((insight) => normalizeCategory(insight.category) === category)
      .map((insight) => ({
        publishedAt: insight.published_at,
        id: insight.id,
        item: { type: "article" as const, title: insight.title, description: insight.excerpt, metadata: `${calculateReadingTime(insight.body)} MIN READ`, href: `/insights/${encodeURIComponent(insight.slug)}` },
      })),
  ]
    .sort((a, b) => publishedTime(b.publishedAt) - publishedTime(a.publishedAt) || b.id - a.id)
    .slice(0, 3);

  if (evidence.length === 0) return null;
  const items = evidence.map(({ item }) => item);
  const gridCountClass = items.length === 1 ? styles.evidenceGridSingle : items.length === 2 ? styles.evidenceGridTwo : styles.evidenceGridThree;

  return <ServiceSection labelledBy="service-evidence-title" className={styles.evidence}>
    <ServiceSectionHeader
      eyebrow="EVIDENCE"
      title={title}
      description={description}
      titleId="service-evidence-title"
      className={styles.evidenceHeader}
      descriptionClassName={styles.evidenceLead}
    />
    <div className={`${styles.evidenceGrid} ${gridCountClass}`}>
      {items.map((item) => <Link
        className={`${styles.evidenceItem} ${item.type === "article" ? styles.evidenceArticle : styles.evidenceCaseStudy}`}
        href={item.href}
        aria-label={`${item.type === "article" ? "Read article" : "View case study"}: ${item.title}`}
        key={`${item.type}-${item.href}`}
      >
        <article className={styles.evidenceContent}>
          <p className={`label-eyebrow ${styles.evidenceType}`}>{item.type === "case-study" ? "CASE STUDY" : "ARTICLE"}</p>
          <h3 className={styles.evidenceTitle}>{item.title}</h3>
          <p className={styles.evidenceDescription}>{item.description}</p>
          <div className={styles.evidenceFooter}>
            <p className={styles.evidenceMetadata}>{item.metadata}</p>
            <span className={styles.evidenceAction}>{item.type === "case-study" ? "View case study" : "Read article"}<span aria-hidden="true">→</span></span>
          </div>
        </article>
      </Link>)}
    </div>
  </ServiceSection>;
}

function DesignSystemRecognition() {
  return <ServiceSection labelledBy="service-recognition-title" className={styles.recognition}>
    <ServiceSectionHeader
      eyebrow="RECOGNITION"
      title="A design system may need attention when…"
      titleId="service-recognition-title"
      className={styles.recognitionHeader}
    />
    <ol className={styles.recognitionList}>
      {designSystemRecognition.map((condition, index) => <li key={condition}>
        <span className={styles.recognitionNumber}>{String(index + 1).padStart(2, "0")}</span>
        <p>{condition}</p>
      </li>)}
    </ol>
  </ServiceSection>;
}

function ProductArchitectureRecognition() {
  return <ServiceSection labelledBy="service-recognition-title" width="wide" className={`${styles.recognition} ${styles.productArchitectureRecognition}`}>
    <ServiceSectionHeader
      eyebrow="RECOGNITION"
      title="Product architecture may need attention when…"
      titleId="service-recognition-title"
      className={styles.recognitionHeader}
    />
    <ol className={`${styles.recognitionList} ${styles.productArchitectureRecognitionList}`}>
      {productArchitectureRecognition.map((condition, index) => <li key={condition}>
        <span className={styles.recognitionNumber}>{String(index + 1).padStart(2, "0")}</span>
        <p>{condition}</p>
      </li>)}
    </ol>
  </ServiceSection>;
}

function ServiceClosingCta({ title, description }: { title: string; description: string }) {
  return <ServiceSection labelledBy="service-closing-cta-title" className={styles.recognitionCta}>
    <div className={styles.recognitionCtaInner}>
      <ServiceSectionHeader
        eyebrow="START WITH THE FRICTION"
        title={title}
        titleId="service-closing-cta-title"
        className={styles.recognitionCtaHeading}
      />
      <div className={styles.recognitionCtaCopy}>
        <p>{description}</p>
        <Link href="/contact" className={styles.primaryButton}>Let&apos;s talk <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  </ServiceSection>;
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServiceItemBySlug(slug);
  if (!service) notFound();
  const isProductArchitecture = service.slug === "product-architecture";
  const isDesignSystems = service.slug === "design-systems";
  const isAiEnabledOperations = service.slug === "ai-enabled-design-operations";
  const isGovernanceScale = service.slug === "governance-scale";
  const isCollaborationAlignment = service.slug === "collaboration-alignment";
  const content = isProductArchitecture ? productArchitecture : {
    eyebrow: "DESIGN SYSTEMS",
    lead: "Build scalable, consistent and adaptable systems that drive better products.",
    description: isDesignSystems
      ? "A design system is more than a component library: it is the shared language, principles and governance that connect how teams design, build and evolve products."
      : service.description,
    benefits: isAiEnabledOperations ? aiOperationsBenefits : isGovernanceScale ? governanceScaleBenefits : isCollaborationAlignment ? collaborationAlignmentBenefits : benefits,
    deliverablesIntro: isCollaborationAlignment ? "An alignment practice shaped around the decisions your product and teams need to make." : isGovernanceScale ? "A governance model shaped around your products, teams and stage of scale." : isAiEnabledOperations ? "Practical AI-enabled design operations tailored to your product, team and working culture." : "A complete design system tailored to your product, team and stage of growth.",
    deliverables: isAiEnabledOperations ? aiOperationsDeliverables : isGovernanceScale ? governanceScaleDeliverables : isCollaborationAlignment ? collaborationAlignmentDeliverables : defaultDeliverables,
    approachTitle: "A practical path from ambiguity to momentum.",
    audienceTitle: "A system for teams at a turning point.",
    audienceLead: "Whether you are launching a new product or untangling an existing one, I create the clarity your team needs to move forward."
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org", "@type": "Service", name: service.title, description: service.description,
      url: absoluteUrl(`/services/${encodeURIComponent(service.slug)}`), provider: { "@type": "Person", name: "Andrei Stanescu", url: absoluteUrl("/") },
    }) }} />
    <Nav />
    <main className={styles.main}>
      <section className={`container ${styles.hero} ${isProductArchitecture ? styles.heroArchitecture : ""}`}>
        <div className={styles.heroCopy}>
          <BackButton label="Back to services" fallbackHref="/services" />
          <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
            Services&nbsp; / &nbsp;{service.title}
          </p>
          <h1 className="display-small">{service.title}</h1>
          <p className={`body-large ${styles.heroLead}`}>{content.lead}</p>
          <p className={`body-default ${styles.heroDescription}`}>{content.description}</p>
          <div className={styles.heroActions}><Link href="/contact" className={styles.primaryButton}>Let&apos;s talk <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>
      <section className={`${styles.benefits} ${isDesignSystems || isProductArchitecture ? styles.benefitsQuiet : ""}`}><div className={`container ${styles.benefitsGrid}`}>{content.benefits.map(([title, description], index) => <article key={title} className={styles.benefit}><LatticeBenefitIcon index={index} /><h2>{title}</h2><p>{description}</p></article>)}</div></section>
      {isDesignSystems ? <ServiceSection labelledBy="service-work-title" className={`${styles.delivery} ${styles.designSystemDelivery}`}>
        <ServiceSectionHeader
          eyebrow="WHAT THE WORK CAN INVOLVE"
          title={content.deliverablesIntro}
          titleId="service-work-title"
          className={styles.deliveryCopy}
          eyebrowClassName={styles.deliveryEyebrow}
          titleClassName={`heading-02 ${styles.deliveryHeading}`}
        />
        <ul className={styles.deliverables}>{content.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
      </ServiceSection> : <ServiceSection labelledBy="service-deliverables-title" width={isProductArchitecture ? "wide" : "contained"} className={`${styles.delivery} ${isProductArchitecture ? styles.architectureDelivery : ""}`}>
        <div className={styles.deliveryCopy}>
          <ServiceSectionHeader
            eyebrow={isProductArchitecture ? "WHAT THE WORK CAN INVOLVE" : "DELIVERABLES"}
            title={content.deliverablesIntro}
            titleId="service-deliverables-title"
            eyebrowClassName={styles.deliveryEyebrow}
            titleClassName={`heading-02 ${styles.deliveryHeading}`}
          />
          <ul className={styles.deliverables}>{content.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        {isProductArchitecture ? <ProductArchitectureGraphic /> : isAiEnabledOperations ? <AiOperationsGraphic /> : isGovernanceScale ? <GovernanceScaleGraphic /> : isCollaborationAlignment ? <CollaborationAlignmentGraphic /> : <div className={styles.systemPreview}><strong>Aa</strong><div className={styles.tokenRow}><span className={`${styles.token} ${styles.tokenLight}`} /><span className={`${styles.token} ${styles.tokenDark}`} /></div><p className={styles.systemCaption}>Tokens / components / code</p></div>}
      </ServiceSection>}
      {isDesignSystems && <DesignSystemEcosystem />}
      {isDesignSystems ? <DesignSystemApproach /> : isProductArchitecture ? <><ProductArchitectureTransformation /><ProductArchitectureApproach /></> : <ServiceSection labelledBy="service-approach-title" className={styles.approach}><ServiceSectionHeader eyebrow="APPROACH" title={content.approachTitle} titleId="service-approach-title" /><div className={styles.approachGrid}>{steps.map(([number, title, description]) => <article key={number} className={styles.step}><span className={styles.stepNumber}>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></ServiceSection>}
      {(isDesignSystems || isProductArchitecture) && <ServiceEvidence
        categoryName={isProductArchitecture ? "Product Architecture" : "Design Systems"}
        title={isProductArchitecture ? "Product architecture in practice." : "Design systems in practice."}
        description={isProductArchitecture
          ? "Selected work and thinking where product structure clarified journeys, boundaries and decisions."
          : "Selected work and thinking where shared foundations, patterns and governance shaped the outcome."}
      />}
      {isDesignSystems ? <DesignSystemRecognition /> : isProductArchitecture ? <ProductArchitectureRecognition /> : <ServiceSection labelledBy="service-audience-title" className={styles.audience}><ServiceSectionHeader eyebrow="IS THIS YOU?" title={content.audienceTitle} description={content.audienceLead} titleId="service-audience-title" descriptionClassName={styles.audienceLead} /><div className={styles.audienceGrid}>{audiences.map(([number, title, description]) => <article key={number} className={styles.audienceCard}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></ServiceSection>}
      {isDesignSystems && <ServiceClosingCta title="Tell me where things are getting stuck." description="We can look at what’s creating the friction and work out where attention would make the biggest difference." />}
      {isProductArchitecture && <ServiceClosingCta title="Tell me where the product is becoming difficult to reason about." description="We can trace what sits underneath the complexity and work out where clearer structure would make the biggest difference." />}
    </main>
    <Footer hideContactCta={isDesignSystems || isProductArchitecture} />
  </>;
}
