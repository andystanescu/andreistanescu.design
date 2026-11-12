import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { BackButton } from "@/components/BackButton/BackButton";
import { LatticeBenefitIcon } from "@/components/services/LatticeBenefitIcon/LatticeBenefitIcon";
import { DesignSystemGraphic } from "@/components/services/DesignSystemGraphic/DesignSystemGraphic";
import { AiOperationsGraphic, AiOperationalLoop } from "@/components/services/AiOperationsGraphic/AiOperationsGraphic";
import { AiOperationsApproach } from "@/components/services/AiOperationsApproach/AiOperationsApproach";
import { GovernanceChangeModel } from "@/components/services/GovernanceChangeModel/GovernanceChangeModel";
import { GovernanceTension } from "@/components/services/GovernanceTension/GovernanceTension";
import { GovernanceApproach } from "@/components/services/GovernanceApproach/GovernanceApproach";
import { ServiceRecognition } from "@/components/services/ServiceRecognition/ServiceRecognition";
import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";
import { ServiceEvidenceGrid, type EvidenceItem } from "@/components/services/ServiceEvidenceGrid";
import { getCaseStudies } from "@/data/caseStudies";
import { getInsights } from "@/data/insights";
import { calculateReadingTime } from "@/lib/readingTime";
import { getServiceItemBySlug, getServiceTemplate } from "@/lib/serviceItems";
import { getServiceHeroCopy } from "@/lib/serviceHero";
import { getServiceSectionOrder, parseServiceSectionSettings, sectionLayout, sectionVisible, type ServiceSectionKey } from "@/lib/serviceSectionSettings";
import { LiveComponentBlock } from "@/components/LiveComponentBlock/LiveComponentBlock";
import { getServiceSectionContent, parseServiceSectionOverrides } from "@/lib/serviceSectionContent";
import { getCategoryNamesForLegacyName } from "@/lib/categories";
import { db } from "@/lib/db";
import { RichContent } from "@/components/RichContent/RichContent";
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
const aiOperationsBenefits = [["More capacity, safely", "Assistive workflows that preserve a consistent quality bar."], ["Shorter review cycles", "AI-supported preparation and iteration where it genuinely helps."], ["Visible human judgement", "Clear review points keep decisions accountable and explainable."], ["Operations that learn", "People review evidence and approve changes to the workflow."]];
const aiOperationsBenefitStages = ["CAPACITY", "SPEED", "OVERSIGHT", "LEARNING"] as const;
const governanceScaleBenefits = [["Shared ownership", "Clear responsibilities make a system easier to trust and contribute to."], ["Lightweight decisions", "Principles and contribution paths reduce unnecessary debate."], ["Visible stewardship", "Teams know who maintains the system and how decisions are made."], ["Durable momentum", "Governance evolves with the organisation instead of slowing it down."]];
const collaborationAlignmentBenefits = [["Shared context", "Everyone is solving the same version of the problem."], ["Useful disagreement", "Different perspectives surface assumptions rather than creating parallel conversations."], ["Clear decisions", "Teams know what was decided and why."], ["Coordinated action", "Different disciplines can move independently without pulling in different directions."]];
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
const defaultDeliverables = ["Design system strategy and roadmap", "Information architecture and structure", "Design tokens and theming", "Component library and patterns", "Accessibility and inclusive design", "Documentation and guidelines", "Governance and adoption model"];
const aiOperationsDeliverables = ["AI opportunity and delegation mapping", "Workflow and operational journey mapping", "Human-in-the-loop decision design", "AI interaction and prompt patterns", "Exception handling and escalation flows", "Prototype-to-production implementation guidance", "Measurement, governance and adoption framework"];
const governanceScaleDeliverables = ["Governance strategy and operating model", "Roles, responsibilities and ownership map", "Decision principles and escalation paths", "Contribution and change-management workflow", "Review cadence and quality guardrails", "Adoption measurement and reporting framework", "Evolution and stewardship model"];
const collaborationAlignmentDeliverables = ["Shared problem framing and success criteria", "Cross-functional decision principles", "Responsibilities and collaboration boundaries", "Decision and communication models", "Collaborative working sessions where useful", "Decision documentation and traceability", "Team rituals and ways of working"];
const collaborationPerspectives = [
  ["Product", "Goals, priorities and how the product creates value."],
  ["Design", "User needs, experience quality and interaction."],
  ["Engineering", "Technical constraints, feasibility and system health."],
  ["Business & users", "Operational realities, evidence and lived context."],
] as const;

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

function CollaborationAlignmentModel() {
  const stages = [
    ["Discussion & disagreement", "Surface assumptions and test different interpretations."],
    ["Decision", "Make clear what was decided, why and what remains open."],
    ["Coordinated action", "Move independently while working toward the same direction."],
  ];

  return <ServiceSection labelledBy="service-alignment-model-title" width="wide" className={styles.collaborationAlignmentModel}>
    <ServiceSectionHeader
      eyebrow="ALIGNMENT MODEL"
      title="Different perspectives can move in the same direction."
      description="Shared understanding gives teams a basis for useful disagreement and clear decisions, without requiring everyone to think alike."
      titleId="service-alignment-model-title"
      className={styles.collaborationModelHeader}
    />
    <div className={styles.collaborationModelCanvas}>
      <ul className={styles.collaborationPerspectives} aria-label="Distinct perspectives and context">
        {collaborationPerspectives.map(([name, description]) => <li key={name}>
          <h3>{name}</h3>
          <p>{description}</p>
        </li>)}
      </ul>
      <div className={styles.collaborationSharedContext}>
        <span>SHARED CONTEXT</span>
        <p>What we know, what matters, and where perspectives differ.</p>
      </div>
      <ol className={styles.collaborationDecisionFlow}>
        {stages.map(([title, description], index) => <li key={title}>
          <span className={styles.collaborationFlowNumber}>{`0${index + 1}`}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </li>)}
      </ol>
      <p className={styles.collaborationModelFeedback}><span aria-hidden="true">↶</span> Action creates new evidence. Teams can revisit a decision when the context changes.</p>
    </div>
  </ServiceSection>;
}

function CollaborationAgreement() {
  const sharedUnderstanding = ["The problem", "The alternatives", "What was decided", "Why it was decided", "What happens next"];

  return <ServiceSection labelledBy="service-alignment-agreement-title" width="wide" className={styles.collaborationAgreement}>
    <ServiceSectionHeader
      eyebrow="ALIGNMENT ≠ AGREEMENT"
      title="Alignment doesn’t require agreement."
      description="Different perspectives should surface early enough to be useful. The problem is when there is no way to turn that difference into a decision."
      titleId="service-alignment-agreement-title"
      className={styles.collaborationAgreementHeader}
    />
    <div className={styles.collaborationAgreementContrast}>
      <div className={styles.collaborationAgreementSide}>
        <span>AGREEMENT</span>
        <p className={styles.collaborationAgreementQuote}>“We all prefer the same option.”</p>
      </div>
      <span className={styles.collaborationAgreementNotEqual} aria-label="does not equal">≠</span>
      <div className={`${styles.collaborationAgreementSide} ${styles.collaborationAgreementDefinition}`}>
        <span>ALIGNMENT</span>
        <p className={styles.collaborationAgreementQuote}>“We understand…”</p>
        <ul>{sharedUnderstanding.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
    <p className={styles.collaborationAgreementFootnote}>Healthy disagreement helps teams test assumptions. Clear decisions give different disciplines a way to move forward together.</p>
  </ServiceSection>;
}

function CollaborationApproach() {
  const stages = [
    ["Understand the landscape", "Build a broad view of goals, constraints, responsibilities and incentives."],
    ["Find where understanding diverges", "Notice where teams are working from different versions of the problem."],
    ["Surface assumptions and constraints", "Make the evidence, tradeoffs and limits behind each perspective visible."],
    ["Create shared context", "Establish what is understood and where meaningful differences remain."],
    ["Make or enable the decision", "Clarify who decides, what matters and how the decision will be carried forward."],
    ["Move through real work", "Try the shared direction in delivery, where ownership and constraints become concrete."],
    ["Observe where alignment breaks", "Learn where context, incentives or decision paths need to change."],
  ];

  return <ServiceSection labelledBy="service-approach-title" width="wide" className={styles.collaborationApproach}>
    <ServiceSectionHeader
      eyebrow="APPROACH"
      title="Build shared understanding. Test it in the work."
      description="More communication alone rarely fixes misalignment. Friction can come from missing context, unclear ownership, competing incentives or no usable way to make a decision."
      titleId="service-approach-title"
      className={styles.collaborationApproachHeader}
    />
    <ol className={styles.collaborationApproachStages}>
      {stages.map(([title, description], index) => <li key={title}>
        <span>{`0${index + 1}`}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </li>)}
    </ol>
    <p className={styles.collaborationApproachFeedback}><span aria-hidden="true">↺</span> Real work reveals what needs attention next, so understanding and decisions can keep evolving.</p>
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

function ServiceEvidence({ categoryId, categoryName, title, description }: { categoryId: number; categoryName: string; title: string; description: string }) {
  const category = String(categoryId);
  const categoryNames = new Set(getCategoryNamesForLegacyName(categoryName).map(normalizeCategory));
  const caseIds = new Set((db.prepare("SELECT case_study_id FROM case_study_categories WHERE category_id = ?").all(categoryId) as Array<{ case_study_id: number }>).map((row) => row.case_study_id));
  const evidence: Array<{ publishedAt: string; id: number; item: EvidenceItem }> = [
    ...getCaseStudies()
      .filter((study) => caseIds.has(study.id))
      .map((study) => ({
        publishedAt: study.published_at,
        id: study.id,
        item: { type: "case-study" as const, title: study.title, description: study.description, metadata: study.year, href: `/work/${encodeURIComponent(study.slug)}` },
      })),
    ...getInsights()
      .filter((insight) => categoryNames.has(normalizeCategory(insight.category)))
      .map((insight) => ({
        publishedAt: insight.published_at,
        id: insight.id,
        item: { type: "article" as const, title: insight.title, description: insight.excerpt, metadata: `${calculateReadingTime(insight.body)} MIN READ`, href: `/insights/${encodeURIComponent(insight.slug)}` },
      })),
  ]
    ;

  if (evidence.length === 0) return null;
  const items = evidence.map(({ item }) => item);

  return <ServiceSection labelledBy="service-evidence-title" className={styles.evidence}>
    <ServiceSectionHeader
      eyebrow="EVIDENCE"
      title={title}
      description={description}
      titleId="service-evidence-title"
      className={styles.evidenceHeader}
      descriptionClassName={styles.evidenceLead}
    />
    <ServiceEvidenceGrid category={category} items={items} />
  </ServiceSection>;
}

function ServiceClosingCta({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <ServiceSection labelledBy="service-closing-cta-title" className={styles.recognitionCta}>
    <div className={styles.recognitionCtaInner}>
      <ServiceSectionHeader
        eyebrow={eyebrow}
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
  const template = getServiceTemplate(service);
  const defaultHero = getServiceHeroCopy(template, service.description);
  const sectionContent = getServiceSectionContent(template, parseServiceSectionOverrides(service.section_content));
  const settings = parseServiceSectionSettings(service.section_settings);
  const outcomeLayout = sectionLayout(settings, "outcomes", template);
  const workLayout = sectionLayout(settings, "work", template);
  const aiWorkLayout = workLayout === "ai-enabled-design-operations" || (workLayout === "product-architecture" && template === "ai-enabled-design-operations");
  const recognitionLayout = sectionLayout(settings, "recognition", template);
  const isProductArchitecture = template === "product-architecture";
  const isDesignSystems = template === "design-systems";
  const isAiEnabledOperations = template === "ai-enabled-design-operations";
  const isGovernanceScale = template === "governance-scale";
  const isCollaborationAlignment = template === "collaboration-alignment";
  const content = isProductArchitecture ? productArchitecture : {
    eyebrow: "DESIGN SYSTEMS",
    lead: isAiEnabledOperations
      ? "Give AI more responsibility without giving up control."
      : isGovernanceScale
      ? "Help good systems survive growth."
      : isCollaborationAlignment
      ? "Turn different perspectives into shared direction."
      : "Build scalable, consistent and adaptable systems that drive better products.",
    description: isAiEnabledOperations
      ? "Put AI to work inside real design and product workflows, with clear boundaries for what it can decide alone and what still needs a person’s judgement."
      : isGovernanceScale
      ? "Clear ownership, standards and a process for exceptions, so a system stays trustworthy as more teams start depending on it, not just at launch."
      : isCollaborationAlignment
      ? "Create enough shared context for product, design and engineering to challenge ideas, make decisions and move forward without repeatedly reopening the same questions. Alignment does not mean everyone agrees; it means understanding what was decided, why, and what happens next."
      : isDesignSystems
      ? "A design system is more than a component library: it is the shared language, principles and governance that connect how teams design, build and evolve products."
      : service.description,
    benefits: isAiEnabledOperations ? aiOperationsBenefits : isGovernanceScale ? governanceScaleBenefits : isCollaborationAlignment ? collaborationAlignmentBenefits : benefits,
    deliverablesIntro: isCollaborationAlignment ? "An alignment practice shaped around the decisions your product and teams need to make." : isGovernanceScale ? "A governance model shaped around your products, teams and stage of scale." : isAiEnabledOperations ? "Practical AI-enabled design operations tailored to your product, team and working culture." : "A complete design system tailored to your product, team and stage of growth.",
    deliverables: isAiEnabledOperations ? aiOperationsDeliverables : isGovernanceScale ? governanceScaleDeliverables : isCollaborationAlignment ? collaborationAlignmentDeliverables : defaultDeliverables,
    approachTitle: "A practical path from ambiguity to momentum.",
    audienceTitle: "A system for teams at a turning point.",
    audienceLead: "Whether you are launching a new product or untangling an existing one, I create the clarity your team needs to move forward."
  };
  const sectionNodes: Partial<Record<ServiceSectionKey, ReactNode>> = {
    additionalContent: (service.body && sectionVisible(settings, "additionalContent", template) && <ServiceSection labelledBy="service-details-title" className={styles.delivery}><h2 id="service-details-title" className="heading-02">About {service.title}</h2><RichContent html={service.body} /></ServiceSection>),
    outcomes: (sectionVisible(settings, "outcomes", template) && <section className={`${styles.benefits} ${outcomeLayout !== "governance-scale" ? styles.benefitsQuiet : ""} ${outcomeLayout === "ai-enabled-design-operations" ? styles.aiOperationsBenefits : ""} ${outcomeLayout === "governance-scale" ? styles.governanceOutcomes : ""} ${outcomeLayout === "collaboration-alignment" ? styles.collaborationOutcomes : ""}`}><div className={`container ${styles.benefitsGrid}`}>{sectionContent.outcomes.map(({title, description}, index) => <article key={index} className={styles.benefit}>{outcomeLayout === "ai-enabled-design-operations" ? <span className={styles.aiOutcomeStage}>{template === outcomeLayout ? aiOperationsBenefitStages[index] : String(index + 1).padStart(2, "0")}</span> : outcomeLayout === "governance-scale" || outcomeLayout === "collaboration-alignment" ? null : <LatticeBenefitIcon index={index} />}<h2>{title}</h2><p>{description}</p></article>)}</div>{outcomeLayout === "governance-scale" && template === outcomeLayout && <p className={`container ${styles.governanceFeedback}`}><span aria-hidden="true">↻</span> Ownership, decisions and stewardship reinforce one another over time.</p>}{outcomeLayout === "collaboration-alignment" && template === outcomeLayout && <p className={`container ${styles.collaborationFeedback}`}>Shared context makes disagreement useful; clear decisions help different disciplines act in the same direction.</p>}</section>),
    tension: (isGovernanceScale && sectionVisible(settings, "tension", template) && <GovernanceTension />),
    work: (sectionVisible(settings, "work", template) && (workLayout === "design-systems" ? <ServiceSection labelledBy="service-work-title" className={`${styles.delivery} ${styles.designSystemDelivery}`}>
        <ServiceSectionHeader
          eyebrow="WHAT THE WORK CAN INVOLVE"
          title={sectionContent.workTitle}
          titleId="service-work-title"
          className={styles.deliveryCopy}
          eyebrowClassName={styles.deliveryEyebrow}
          titleClassName={`heading-02 ${styles.deliveryHeading}`}
        />
        <ul className={styles.deliverables}>{sectionContent.workItems.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </ServiceSection> : <ServiceSection labelledBy="service-deliverables-title" width={workLayout !== "collaboration-alignment" ? "wide" : "contained"} className={`${styles.delivery} ${workLayout === "product-architecture" && !aiWorkLayout ? styles.architectureDelivery : ""} ${aiWorkLayout ? styles.aiOperationsDelivery : ""} ${workLayout === "governance-scale" ? styles.governanceDelivery : ""} ${workLayout === "collaboration-alignment" ? styles.collaborationDelivery : ""}`}>
        <div className={styles.deliveryCopy}>
          <ServiceSectionHeader
            eyebrow="WHAT THE WORK CAN INVOLVE"
            title={sectionContent.workTitle}
            titleId="service-deliverables-title"
            eyebrowClassName={styles.deliveryEyebrow}
            titleClassName={`heading-02 ${styles.deliveryHeading}`}
          />
          <ul className={styles.deliverables}>{sectionContent.workItems.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </div>
        {aiWorkLayout ? <AiOperationsGraphic /> : workLayout === "product-architecture" ? <ProductArchitectureGraphic /> : null}
      </ServiceSection>)),
    alignment: (isCollaborationAlignment && sectionVisible(settings, "alignment", template) && <CollaborationAlignmentModel />),
    agreement: (isCollaborationAlignment && sectionVisible(settings, "agreement", template) && <CollaborationAgreement />),
    operationalLoop: (isAiEnabledOperations && sectionVisible(settings, "operationalLoop", template) && <AiOperationalLoop />),
    changeModel: (isGovernanceScale && sectionVisible(settings, "changeModel", template) && <GovernanceChangeModel />),
    ecosystem: (isDesignSystems && sectionVisible(settings, "ecosystem", template) && <DesignSystemEcosystem />),
    approach: (sectionVisible(settings, "approach", template) && (settings.approachCode.trim() ? <ServiceSection labelledBy="custom-service-approach-title" className={styles.approach}><h2 id="custom-service-approach-title" className="label-eyebrow">APPROACH</h2><LiveComponentBlock code={settings.approachCode} runtime="react" chrome="minimal" /></ServiceSection> : isDesignSystems ? <DesignSystemApproach /> : isProductArchitecture ? <ProductArchitectureApproach /> : isAiEnabledOperations ? <AiOperationsApproach /> : isGovernanceScale ? <GovernanceApproach /> : isCollaborationAlignment ? <CollaborationApproach /> : <ServiceSection labelledBy="service-approach-title" className={styles.approach}><ServiceSectionHeader eyebrow="APPROACH" title={content.approachTitle} titleId="service-approach-title" /><div className={styles.approachGrid}>{steps.map(([number, title, description]) => <article key={number} className={styles.step}><span className={styles.stepNumber}>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></ServiceSection>)),
    evidence: (sectionVisible(settings, "evidence", template) && <ServiceEvidence
        categoryId={service.category_id}
        categoryName={service.title}
        title={`${service.title} in practice.`}
        description={sectionContent.evidenceDescription}
      />),
    recognition: (sectionVisible(settings, "recognition", template) && <ServiceRecognition template={recognitionLayout} title={sectionContent.recognitionTitle} signals={sectionContent.recognitionSignals} />),
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
          <p className={`body-large ${styles.heroLead}`}>{service.hero_lead || defaultHero.lead}</p>
          {(service.hero_description || defaultHero.description) && <p className={`body-default ${styles.heroDescription}`}>{service.hero_description || defaultHero.description}</p>}
          <div className={styles.heroActions}><Link href="/contact" className={styles.primaryButton}>Let&apos;s talk <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>
      {getServiceSectionOrder(settings, template, Boolean(service.body)).map((key) => <Fragment key={key}>{sectionNodes[key]}</Fragment>)}
      <ServiceClosingCta eyebrow={sectionContent.ctaEyebrow} title={sectionContent.ctaTitle} description={sectionContent.ctaDescription} />
    </main>
    <Footer hideContactCta />
  </>;
}
