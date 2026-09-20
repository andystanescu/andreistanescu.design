import Link from "next/link";
import styles from "./ServiceIndexItem.module.css";

type ServiceIndexItemProps = { slug: string; title: string; description: string; index: number; icon?: string; featured?: boolean };

export function ServiceIndexItem({ slug, title, description, index, icon, featured = false }: ServiceIndexItemProps) {
  return (
    <li className={featured ? styles.featuredItem : undefined}>
      <Link href={`/services/${slug}`} className={`${styles.item} ${featured ? styles.featured : ""}`}>
        <span className={styles.index}>{String(index).padStart(2, "0")}</span>
        {icon && (
          // Service icons can be uploaded through the CMS and do not have stable dimensions at build time.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className={styles.icon} />
        )}
        <span className={styles.copy}>
          <h2 className="heading-02">{title}</h2>
          <span className={`body-default ${styles.description}`}>{description}</span>
        </span>
        <span className={styles.action}>
          <span className={styles.actionLabel}>Learn more</span>
          <span aria-hidden="true">→</span>
        </span>
      </Link>
    </li>
  );
}
