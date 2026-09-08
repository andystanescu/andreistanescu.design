import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { BackButton } from "@/components/BackButton/BackButton";
import { LatticeDiagram } from "@/components/home/Hero/LatticeDiagram";
import { LatticeInteractive } from "@/components/home/Hero/LatticeInteractive";
import { LatticeBenefitIcon } from "@/components/services/LatticeBenefitIcon/LatticeBenefitIcon";
import { DesignSystemGraphic } from "@/components/services/DesignSystemGraphic/DesignSystemGraphic";
import { AiOperationsGraphic } from "@/components/services/AiOperationsGraphic/AiOperationsGraphic";
import { GovernanceScaleGraphic } from "@/components/services/GovernanceScaleGraphic/GovernanceScaleGraphic";
import { CollaborationAlignmentGraphic } from "@/components/services/CollaborationAlignmentGraphic/CollaborationAlignmentGraphic";
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
const audiences = [["01", "Growing product teams", "Bring consistency to a product portfolio that is expanding faster than the system behind it."], ["02", "Design & engineering leads", "Align decisions, ownership and implementation around one shared product language."], ["03", "Organisations in transition", "Turn fragmented patterns into a durable foundation for the next stage of growth."]];
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

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServiceItemBySlug(slug);
  if (!service) notFound();
  const isProductArchitecture = service.slug === "product-architecture";
  const isAiEnabledOperations = service.slug === "ai-enabled-design-operations";
  const isGovernanceScale = service.slug === "governance-scale";
  const isCollaborationAlignment = service.slug === "collaboration-alignment";
  const content = isProductArchitecture ? productArchitecture : {
    eyebrow: "DESIGN SYSTEMS",
    lead: "Build scalable, consistent and adaptable systems that drive better products.",
    description: service.description,
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
        <div className={styles.lattice} aria-hidden="true"><LatticeInteractive><LatticeDiagram /></LatticeInteractive></div>
      </section>
      <section className={styles.benefits}><div className={`container ${styles.benefitsGrid}`}>{content.benefits.map(([title, description], index) => <article key={title} className={styles.benefit}><LatticeBenefitIcon index={index} /><h2>{title}</h2><p>{description}</p></article>)}</div></section>
      <section className={`container ${styles.delivery}`}><div className={styles.deliveryCopy}><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>DELIVERABLES</p><h2 className="heading-02">{content.deliverablesIntro}</h2><ul className={styles.deliverables}>{content.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div>{isProductArchitecture ? <ProductArchitectureGraphic /> : service.slug === "design-systems" ? <DesignSystemGraphic /> : isAiEnabledOperations ? <AiOperationsGraphic /> : isGovernanceScale ? <GovernanceScaleGraphic /> : isCollaborationAlignment ? <CollaborationAlignmentGraphic /> : <div className={styles.systemPreview}><strong>Aa</strong><div className={styles.tokenRow}><span className={`${styles.token} ${styles.tokenLight}`} /><span className={`${styles.token} ${styles.tokenDark}`} /></div><p className={styles.systemCaption}>Tokens / components / code</p></div>}</section>
      <section className={`container ${styles.approach}`}><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>APPROACH</p><h2 className="heading-02">{content.approachTitle}</h2><div className={styles.approachGrid}>{steps.map(([number, title, description]) => <article key={number} className={styles.step}><span className={styles.stepNumber}>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
      <section className={`container ${styles.audience}`}><p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>IS THIS YOU?</p><h2 className="heading-02">{content.audienceTitle}</h2><p className={styles.audienceLead}>{content.audienceLead}</p><div className={styles.audienceGrid}>{audiences.map(([number, title, description]) => <article key={number} className={styles.audienceCard}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    </main>
    <Footer />
  </>;
}
