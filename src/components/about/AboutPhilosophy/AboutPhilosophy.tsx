import { getSection, getPhilosophyItems } from "@/lib/about";
import { AboutSectionShell } from "@/components/about/AboutSectionShell/AboutSectionShell";
import { FourItemPrinciplesLayout } from "@/components/FourItemPrinciplesLayout/FourItemPrinciplesLayout";

export function AboutPhilosophy() {
  const section = getSection("philosophy")!;
  const items = getPhilosophyItems();

  if (items.length === 0) {
    return null;
  }

  return (
    <AboutSectionShell id="philosophy" eyebrow={section.eyebrow} heading={section.headline} intro={section.description} contentWidth="wide">
      <FourItemPrinciplesLayout
        items={items.map((item, index) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          media: item.icon,
          number: String(index + 1).padStart(2, "0"),
        }))}
      />
    </AboutSectionShell>
  );
}
