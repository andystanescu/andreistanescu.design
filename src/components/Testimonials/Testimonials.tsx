import { getSection as getHomepageSection } from "@/lib/homepage";
import { getSection as getAboutSection } from "@/lib/about";
import { getTestimonials } from "@/lib/testimonials";
import { HomepageSectionHeader } from "@/components/home/SectionHeader/HomepageSectionHeader";
import { TestimonialCard } from "./TestimonialCard";
import styles from "./Testimonials.module.css";

export function Testimonials({ page, preview = false }: { page: "homepage" | "about"; preview?: boolean }) {
  const section = page === "homepage" ? getHomepageSection("testimonials") : getAboutSection("testimonials");
  const items = getTestimonials();
  if (!section || (!items.length && !preview)) return null;
  return <section className={styles.section} id="testimonials"><div className={`container ${styles.inner}`}>
    <HomepageSectionHeader eyebrow={section.eyebrow} title={section.headline} intro={section.description} />
    {items.length ? <div className={styles.strip} aria-label="Testimonials" tabIndex={0}>{items.map((item) => <TestimonialCard key={item.id} item={item} />)}</div> : <p className="body-small">Publish a testimonial to see it here.</p>}
  </div></section>;
}
