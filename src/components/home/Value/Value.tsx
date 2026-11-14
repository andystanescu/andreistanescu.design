import Link from "next/link";
import { getSection } from "@/lib/homepage";
import { getValueEvidenceOptions, parseValueContent } from "@/lib/homepageValue";
import { HomepageSectionHeader } from "@/components/home/SectionHeader/HomepageSectionHeader";
import styles from "./Value.module.css";

export function Value() {
  const section = getSection("value");
  if (!section) return null;
  const options = getValueEvidenceOptions();
  return <section id="value" className={styles.section}><div className={`container ${styles.inner}`}>
    <HomepageSectionHeader eyebrow={section.eyebrow} title={section.headline} intro={section.description} className={styles.header} />
    <div className={styles.propositions}>{parseValueContent(section.content).map((item, index) => {
      const evidence = options.find((option) => option.type === item.evidence?.type && option.id === item.evidence.id);
      return <article className={styles.proposition} key={index}><span className={styles.number}>{String(index + 1).padStart(2, "0")}</span><h3 data-value-field={`value_${index}_title`}>{item.title}</h3><p data-value-field={`value_${index}_description`}>{item.description}</p><Link href={evidence?.href || "#"} hidden={!evidence} data-value-evidence={index} className={styles.evidence}><span>{evidence?.type === "case_study" ? "Case study" : "Article"}</span><strong>{evidence?.title || ""}</strong><span aria-hidden="true">↗</span></Link></article>;
    })}</div>
  </div></section>;
}
