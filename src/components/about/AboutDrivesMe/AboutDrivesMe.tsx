import { getSection } from "@/lib/about";
import { AboutSectionShell } from "@/components/about/AboutSectionShell/AboutSectionShell";
import { FourItemPrinciplesLayout } from "@/components/FourItemPrinciplesLayout/FourItemPrinciplesLayout";

// Fixed content, matching the Figma design exactly — unlike Philosophy and
// Highlights, these 4 items are not admin-editable (only the section's own
// eyebrow/headline/description are, via /admin/about). Reuses the same
// service-mark icons already shipped for the Services section.
const ITEMS = [
  {
    icon: "/assets/mark-design-systems.svg",
    title: "Solve causes, not symptoms",
    description:
      "I look beyond the visible problem to understand the system that created it. Whether the challenge lies in governance, collaboration, design systems or organisational structure, my goal is always to improve the underlying conditions that allow quality to emerge consistently.",
  },
  {
    icon: "/assets/mark-product-architecture.svg",
    title: "Quality is never negotiable",
    description:
      "Every engagement receives the same level of care, reasoning and attention. Budgets influence the scope of my work, not the standard of it. When trade-offs are necessary, I reduce breadth before I reduce quality.",
  },
  {
    icon: "/assets/mark-ai-design-ops.svg",
    title: "Build independence, not dependency",
    description:
      "My success isn't measured by how long you need me. It's measured by how much stronger your business becomes because I was there. I share my reasoning, challenge assumptions and leave organisations better equipped to continue evolving long after an engagement ends.",
  },
  {
    icon: "/assets/mark-governance-scale.svg",
    title: "Preserve the thinking",
    description:
      "Technology changes. Teams change. Organisations change. What should endure is the quality of the reasoning behind every decision. I help organisations capture, communicate and evolve that thinking so knowledge becomes a lasting capability.",
  },
];

export function AboutDrivesMe() {
  const section = getSection("drives_me")!;

  return (
    <AboutSectionShell id="drives_me" variant="surface" eyebrow={section.eyebrow} heading={section.headline} intro={section.description} contentWidth="wide">
      <FourItemPrinciplesLayout
        items={ITEMS.map((item) => ({
          id: item.title,
          title: item.title,
          description: item.description,
          media: item.icon,
        }))}
      />
    </AboutSectionShell>
  );
}
