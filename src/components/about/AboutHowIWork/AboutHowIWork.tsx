import { getApproachSteps } from "@/lib/approachSteps";
import { getSettings } from "@/lib/settings";
import { AboutSectionShell } from "@/components/about/AboutSectionShell/AboutSectionShell";
import { ProcessStepper } from "@/components/ProcessStepper/ProcessStepper";

export function AboutHowIWork() {
  const steps = getApproachSteps();
  const settings = getSettings();
  return (
    <AboutSectionShell id="how-i-work" variant="separated" eyebrow={settings.approach_how_eyebrow || "HOW I WORK"} heading={settings.approach_how_title} headingClassName="heading-01" contentWidth="full">
      {steps.length > 0 ? <ProcessStepper steps={steps} label={settings.approach_how_title} /> : <p className="body-default" style={{ color: "var(--text-tertiary)" }}>My approach is on its way — check back soon.</p>}
    </AboutSectionShell>
  );
}
