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
const audiences = [["01", "Growing product teams", "Bring consistency to a product portfolio that is expanding faster than the system behind it."], ["02", "Design & engineering leads", "Align decisions, ownership and implementation around one shared product language."], ["03", "Organisations in transition", "Turn fragmented patterns into a durable foundation for the next stage of growth."]];
const designSystemRecognition = [
  "The component library exists, but teams adopt it inconsistently.",
  "Figma and the production implementation have drifted apart.",
  "Teams keep rebuilding the same patterns across products.",
  "Documentation can no longer be trusted to describe how the system works.",
  "Nobody is sure who owns changes to the system.",
  "New products cannot use the system safely without workarounds.",
];
const defaultDeliverables = ["Design system strategy and roadmap", "Information architecture and structure", "Design tokens and theming", "Component library and patterns", "Accessibility and inclusive design", "Documentation and guidelines", "Governance and adoption model"];
const aiOperationsDeliverables = ["AI opportunity and automation roadmap", "Workflow and operational journey mapping", "Human-in-the-loop decision design", "AI interaction and prompt patterns", "Exception handling and escalation flows", "Prototype-to-production implementation guidance", "Measurement, governance and adoption framework"];
const governanceScaleDeliverables = ["Governance strategy and operating model", "Roles, responsibilities and ownership map", "Decision principles and escalation paths", "Contribution and change-management workflow", "Review cadence and quality guardrails", "Adoption measurement and reporting framework", "Long-term evolution and stewardship roadmap"];
const collaborationAlignmentDeliverables = ["Stakeholder alignment and working-session plan", "Shared vision, principles and success criteria", "Cross-functional decision framework", "Roles, responsibilities and handoff model", "Collaborative journey and workshop outputs", "Communication and decision documentation", "Team rituals and alignment playbook"];

const productArchitecture = {
  eyebrow: "PRODUCT ARCHITECTURE",
  lead: "Shape the structure behind complex products so teams can make better decisions, faster.",
  description: "I clarify domains, journeys and system boundaries so the product can scale without accumulating avoidable complexity.",
  benefits: [["Clearer decisions", "Make the relationships between domains, journeys and capabilities visible."], ["Coherent experiences", "Connect product surfaces around a shared structure and vocabulary."], ["Stronger alignment", "Give design, engineering and product one model to work from."], ["Confident growth", "Create boundaries that support change without fragmenting the product."]],
  deliverablesIntro: "A practical architecture that connects the product language, its users and the teams who evolve it.",
  deliverables: ["Product architecture strategy and roadmap", "Domain and capability mapping", "Information architecture and navigation model", "End-to-end journey and service blueprint", "Content and data model alignment", "Platform and integration boundary definition", "Architecture principles and governance model"],
  approachTitle: "A practical path from ambiguity to product structure.",
  audienceTitle: "A structure for products at a turning point.",
  audienceLead: "Whether you are shaping a new product or untangling an existing one, I make the underlying relationships clear enough for teams to move with confidence."
};

function ProductArchitectureGraphic() {
  return <div className={styles.architectureGraphic} aria-label="Product architecture model showing how users, domains, surfaces and teams connect through a shared product language.">
    <div className={styles.architectureHeader}><span>PRODUCT ARCHITECTURE</span><span>COHESION MODEL</span></div>
    <div className={styles.architectureMap}>
      <div className={`${styles.architectureNode} ${styles.architectureSatellite}`}><span>01</span><strong>Users</strong><small>Needs and journeys</small></div>
      <div className={`${styles.architectureNode} ${styles.architectureSatellite}`}><span>02</span><strong>Domains</strong><small>Capabilities and rules</small></div>
      <div className={styles.architectureSpine}><span>SHARED PRODUCT LANGUAGE</span><strong>Structure<br />that holds</strong><div className={styles.architectureLayers}><i>Model</i><i>Patterns</i><i>Governance</i></div></div>
      <div className={`${styles.architectureNode} ${styles.architectureSatellite}`}><span>03</span><strong>Surfaces</strong><small>Flows and interfaces</small></div>
      <div className={`${styles.architectureNode} ${styles.architectureSatellite}`}><span>04</span><strong>Teams</strong><small>Ownership and delivery</small></div>
    </div>
    <div className={styles.architectureFooter}><span>CONNECTED BY INTENT</span><span aria-hidden="true">↗</span></div>
  </div>;
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

function DesignSystemEvidence() {
  const category = normalizeCategory("Design Systems");
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
      title="Design systems in practice."
      description="Selected work and thinking where shared foundations, patterns and governance shaped the outcome."
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

function DesignSystemClosingCta() {
  return <ServiceSection labelledBy="service-closing-cta-title" className={styles.recognitionCta}>
    <div className={styles.recognitionCtaInner}>
      <ServiceSectionHeader
        eyebrow="START WITH THE FRICTION"
        title="Tell me where things are getting stuck."
        titleId="service-closing-cta-title"
        className={styles.recognitionCtaHeading}
      />
      <div className={styles.recognitionCtaCopy}>
        <p>We can look at what’s creating the friction and work out where attention would make the biggest difference.</p>
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
      <section className={`container ${styles.hero}`}>
        <div className={styles.heroCopy}>
          <BackButton label="Back to services" fallbackHref="/services" />
          <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
            Services&nbsp; / &nbsp;{service.title}
          </p>
          <h1 className="display-small">{service.title}</h1>
          <p className={`body-large ${styles.heroLead}`}>{content.lead}</p>
          <p className={`body-default ${styles.heroDescription}`}>{content.description}</p>
          <div className={styles.heroActions}><Link href="/contact" className={styles.primaryButton}>Start a project <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>
      <section className={`${styles.benefits} ${isDesignSystems ? styles.benefitsQuiet : ""}`}><div className={`container ${styles.benefitsGrid}`}>{content.benefits.map(([title, description], index) => <article key={title} className={styles.benefit}><LatticeBenefitIcon index={index} /><h2>{title}</h2><p>{description}</p></article>)}</div></section>
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
      </ServiceSection> : <ServiceSection labelledBy="service-deliverables-title" className={styles.delivery}>
        <div className={styles.deliveryCopy}>
          <ServiceSectionHeader
            eyebrow="DELIVERABLES"
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
      {isDesignSystems ? <DesignSystemApproach /> : <ServiceSection labelledBy="service-approach-title" className={styles.approach}><ServiceSectionHeader eyebrow="APPROACH" title={content.approachTitle} titleId="service-approach-title" /><div className={styles.approachGrid}>{steps.map(([number, title, description]) => <article key={number} className={styles.step}><span className={styles.stepNumber}>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></ServiceSection>}
      {isDesignSystems && <DesignSystemEvidence />}
      {isDesignSystems ? <><DesignSystemRecognition /><DesignSystemClosingCta /></> : <ServiceSection labelledBy="service-audience-title" className={styles.audience}><ServiceSectionHeader eyebrow="IS THIS YOU?" title={content.audienceTitle} description={content.audienceLead} titleId="service-audience-title" descriptionClassName={styles.audienceLead} /><div className={styles.audienceGrid}>{audiences.map(([number, title, description]) => <article key={number} className={styles.audienceCard}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></ServiceSection>}
    </main>
    <Footer hideContactCta={isDesignSystems} />
  </>;
}
