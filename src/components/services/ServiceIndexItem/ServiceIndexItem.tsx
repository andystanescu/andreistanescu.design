import Link from "next/link";
import styles from "./ServiceIndexItem.module.css";

type ServiceIndexItemProps = {
  slug: string;
  title: string;
  description: string;
  capabilities: string[];
  index: number;
};

export function ServiceIndexItem({ slug, title, description, capabilities, index }: ServiceIndexItemProps) {
  return (
    <li className={styles.row}>
      <Link href={`/services/${slug}`} className={styles.item}>
        <span className={styles.index}>{String(index).padStart(2, "0")}</span>
        <h2 className={`heading-02 ${styles.title}`}>{title}</h2>
        <span className={styles.information}>
          <span className={`body-default ${styles.description}`}>{description}</span>
          {capabilities.length > 0 && (
            <span className={styles.tags} aria-label="Capabilities">
              {capabilities.map((capability) => (
                <span className={`label-tag ${styles.tag}`} key={capability}>{capability}</span>
              ))}
            </span>
          )}
        </span>
        <span className={styles.action}>
          View service <span className={styles.arrow} aria-hidden="true">→</span>
        </span>
      </Link>
    </li>
  );
}
