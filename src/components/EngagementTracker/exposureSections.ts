import { EXPOSURE_RULES } from "@/lib/engagementMeasurement";
import type { EngagementContentType } from "@/lib/analytics";

export type ExposureSection = { detail: string; start: HTMLElement; end: HTMLElement | null; container: HTMLElement };

/** Use public page structure without adding wrappers or changing the visual layout. */
export function collectExposureSections(main: HTMLElement, type: EngagementContentType): ExposureSection[] {
  const sections: ExposureSection[] = [];
  if (type === "case_study" || type === "article") {
    if (type === "case_study") {
      const outcome = main.querySelector<HTMLElement>('section[class*="CaseStudyHero_impact"]');
      if (outcome) sections.push({ detail: "outcomes", start: outcome, end: null, container: outcome });
    }
    const body = main.querySelector<HTMLElement>('[class*="articleBody"]');
    if (body) {
      const headings = Array.from(body.querySelectorAll<HTMLElement>("h2, h3")).filter((heading) => !heading.closest("#engagement-assessment"));
      if (!headings.length && body.textContent?.trim()) sections.push({ detail: "body", start: body, end: null, container: body });
      headings.forEach((heading, index) => sections.push({ detail: `section_${index + 1}`, start: heading, end: headings[index + 1] ?? null, container: body }));
    }
  } else {
    const outerSections = Array.from(main.querySelectorAll<HTMLElement>("section")).filter((section) => !section.parentElement?.closest("section") && section.querySelector("h1, h2, h3"));
    outerSections.forEach((section, index) => sections.push({ detail: `section_${index + 1}`, start: section, end: null, container: section }));
  }
  return sections.slice(0, EXPOSURE_RULES.maxSections);
}

export function sectionIsVisible(section: ExposureSection, viewportHeight: number, viewportWidth: number): boolean {
  const start = section.start.getBoundingClientRect();
  const bottom = section.end ? section.end.getBoundingClientRect().top : section.container.getBoundingClientRect().bottom;
  const height = Math.max(0, bottom - start.top);
  const visibleHeight = Math.max(0, Math.min(bottom, viewportHeight) - Math.max(start.top, 0));
  const threshold = Math.min(100, height / 2, viewportHeight / 4);
  return height > 0 && start.right > 0 && start.left < viewportWidth && visibleHeight >= threshold;
}
