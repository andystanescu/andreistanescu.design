import styles from "@/app/services/[slug]/service-detail.module.css";
import { ServiceSection, ServiceSectionHeader } from "@/components/services/ServiceSection/ServiceSection";

const delegationModes = [
  { label: "HUMAN-LED", ai: "AI assists", human: "Human decides" },
  { label: "SHARED", ai: "AI proposes", human: "Human decides" },
  { label: "SUPERVISED", ai: "AI acts", human: "Human reviews" },
  { label: "AI-LED", ai: "AI acts", human: "Independently" },
];

const decisionExamples = [
  ["LOW CONSEQUENCE", "Routine formatting", "AI can act independently"],
  ["MODERATE CONSEQUENCE", "Preparing a content change", "AI proposes; a person decides"],
  ["HIGH CONSEQUENCE", "Changing product direction", "A person decides; AI assists"],
];

export function AiOperationsGraphic() {
  return (
    <figure className={styles.aiDelegationGraphic} aria-labelledby="ai-delegation-title">
      <figcaption className={styles.aiDelegationIntro}>
        <span className={styles.aiDelegationEyebrow}>DELEGATION IS CONTEXTUAL</span>
        <p id="ai-delegation-title">Different decisions can sit at different points at the same time.</p>
      </figcaption>

      <div className={styles.aiDelegationAxis} aria-hidden="true">
        <span>HUMAN-LED</span>
        <span>INCREASING DELEGATION · WHEN CONFIDENCE ALLOWS</span>
        <span>AI-LED</span>
      </div>
      <ol className={styles.aiDelegationModes} aria-label="Delegation continuum from human-led to AI-led">
        {delegationModes.map((mode, index) => (
          <li key={mode.label} className={styles.aiDelegationMode}>
            <span className={styles.aiDelegationModeLabel}>{mode.label}</span>
            <strong>{mode.ai}</strong>
            <span>{mode.human}</span>
            {index < delegationModes.length - 1 && <span className={styles.aiDelegationArrow} aria-hidden="true">→</span>}
          </li>
        ))}
      </ol>

      <section className={styles.aiDelegationConsequence} aria-labelledby="ai-consequence-title">
        <h3 id="ai-consequence-title">CONSEQUENCE CHANGES THE BOUNDARY</h3>
        <ul>
          {decisionExamples.map(([level, example, response]) => (
            <li key={level}>
              <span>{level}</span>
              <strong>{example}</strong>
              <span>{response}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.aiDelegationEscalation}>
        <span>LOW CONFIDENCE · EXCEPTION · CONFLICTING EVIDENCE</span>
        <span aria-hidden="true">→</span>
        <strong>HUMAN REVIEW / DECISION</strong>
      </p>
      <p className={styles.aiDelegationHumanRole}>
        People set constraints, intervene, review, decide and improve the workflow.
      </p>
    </figure>
  );
}

export function AiOperationalLoop() {
  return (
    <ServiceSection width="wide" labelledBy="ai-operational-loop-title" className={styles.aiOperationalLoop}>
      <div className={styles.aiOperationalLoopContent}>
        <ServiceSectionHeader
          eyebrow="OPERATIONAL LOOP"
          title="Evidence feeds improvement through governed change."
          description="AI can continue within agreed confidence and rules. When uncertainty, exceptions or conflicting evidence appear, human judgement brings the work back within bounds. Outcomes then inform the next cycle."
          titleId="ai-operational-loop-title"
          className={styles.aiOperationalLoopHeader}
          descriptionClassName={styles.aiOperationalLoopIntro}
        />

        <div className={styles.aiOperationalLoopDesktop} role="img" aria-label="Context leads to an AI action or proposal, checked against confidence and rules. Work continues when conditions are met; uncertainty, exceptions, or conflicting evidence route to human judgement. Both paths produce outcomes and evidence, which people use to govern workflow improvements and inform the next cycle.">
          <svg viewBox="0 0 1200 560" aria-hidden="true">
            <defs>
              <marker id="ai-loop-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 6 3 0 6Z" /></marker>
            </defs>
            <path className={styles.aiLoopConnector} d="M146 88H360M426 88H640M706 88H913" markerEnd="url(#ai-loop-arrow)" />
            <circle className={styles.aiLoopDot} cx="120" cy="88" r="8" />
            <circle className={styles.aiLoopDot} cx="400" cy="88" r="8" />
            <circle className={styles.aiLoopDot} cx="680" cy="88" r="8" />
            <path className={styles.aiLoopGate} d="M950 52 986 88 950 124 914 88Z" />
            <text className={styles.aiLoopLabel} x="120" y="130" textAnchor="middle">CONTEXT</text>
            <text className={styles.aiLoopLabel} x="400" y="130" textAnchor="middle">AI ACTS / PROPOSES</text>
            <text className={styles.aiLoopLabel} x="680" y="130" textAnchor="middle">CONFIDENCE + RULES</text>
            <text className={styles.aiLoopMeta} x="950" y="158" textAnchor="middle">CHECK</text>

            <path className={styles.aiLoopConnector} d="M950 124V180H640V206M950 180H1010V206" markerEnd="url(#ai-loop-arrow)" />
            <text className={styles.aiLoopMeta} x="640" y="228" textAnchor="middle">WITHIN BOUNDS</text>
            <text className={styles.aiLoopLabel} x="640" y="253" textAnchor="middle">CONTINUE</text>
            <text className={styles.aiLoopMeta} x="1010" y="228" textAnchor="middle">UNCERTAIN · EXCEPTION · CONFLICT</text>
            <text className={styles.aiLoopLabel} x="1010" y="253" textAnchor="middle">HUMAN JUDGEMENT</text>

            <path className={styles.aiLoopConnector} d="M640 267V300H826M1010 267V300H874M850 300V322" markerEnd="url(#ai-loop-arrow)" />
            <circle className={styles.aiLoopDot} cx="850" cy="345" r="8" />
            <text className={styles.aiLoopLabel} x="850" y="375" textAnchor="middle">OUTCOME</text>
            <path className={styles.aiLoopConnector} d="M850 383V405" markerEnd="url(#ai-loop-arrow)" />
            <text className={styles.aiLoopLabel} x="850" y="435" textAnchor="middle">EVIDENCE</text>
            <path className={styles.aiLoopConnector} d="M850 445V465" markerEnd="url(#ai-loop-arrow)" />
            <text className={styles.aiLoopLabel} x="850" y="495" textAnchor="middle">GOVERNED WORKFLOW IMPROVEMENT</text>

            <path className={styles.aiLoopFeedback} d="M1080 530H78V88H108" markerEnd="url(#ai-loop-arrow)" />
            <text className={styles.aiLoopFeedbackLabel} x="355" y="521" textAnchor="middle">PEOPLE REVIEW EVIDENCE AND APPROVE WORKFLOW CHANGES</text>
          </svg>
        </div>

        <div className={styles.aiOperationalLoopMobile}>
          <ol className={styles.aiLoopSequence}>
            <li><span>CONTEXT</span><strong>Understand the task and its consequences.</strong></li>
            <li><span>AI ACTS / PROPOSES</span><strong>Work within defined confidence and rules.</strong></li>
            <li><span>CHECK</span><strong>Is confidence sufficient and the action within bounds?</strong></li>
          </ol>
          <div className={styles.aiLoopBranches}>
            <p><span>WITHIN BOUNDS</span><strong>Continue</strong></p>
            <p><span>UNCERTAIN · EXCEPTION · CONFLICT</span><strong>Human judgement</strong></p>
          </div>
          <ol className={`${styles.aiLoopSequence} ${styles.aiLoopSequenceReturn}`}>
            <li><span>OUTCOME</span><strong>See what happened in the real workflow.</strong></li>
            <li><span>EVIDENCE</span><strong>Review quality, consequences and exceptions.</strong></li>
            <li><span>GOVERNED IMPROVEMENT</span><strong>People decide whether and how the workflow changes.</strong></li>
          </ol>
          <p className={styles.aiLoopReturn}>↺ Evidence and approved changes inform the next context.</p>
        </div>
      </div>
    </ServiceSection>
  );
}
