import { getSection, getHighlightItems } from "@/lib/about";
import { AboutSectionShell } from "@/components/about/AboutSectionShell/AboutSectionShell";
import { ThreeItemFeatureLayout } from "@/components/ThreeItemFeatureLayout/ThreeItemFeatureLayout";

export function AboutHighlights() {
  const section = getSection("highlights")!;
  const items = getHighlightItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <AboutSectionShell id="highlights" variant="surface" eyebrow={section.eyebrow} heading={section.headline} intro={section.description} contentWidth="wide">
      <ThreeItemFeatureLayout
        items={items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          media: item.icon,
        }))}
      />
    </AboutSectionShell>
  );
}
