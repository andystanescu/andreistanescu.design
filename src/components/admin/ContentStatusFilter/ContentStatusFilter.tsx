import Link from "next/link";
import styles from "./ContentStatusFilter.module.css";

type ContentStatusFilterProps = {
  baseHref: string;
  current: "published" | "draft";
  published: number;
  drafts: number;
};

export function ContentStatusFilter({ baseHref, current, published, drafts }: ContentStatusFilterProps) {
  return (
    <nav className={styles.filters} aria-label="Filter content by publishing status">
      <Link href={`${baseHref}?status=published`} aria-current={current === "published" ? "page" : undefined} className={current === "published" ? styles.active : undefined}>
        Published <span>{published}</span>
      </Link>
      <Link href={`${baseHref}?status=draft`} aria-current={current === "draft" ? "page" : undefined} className={current === "draft" ? styles.active : undefined}>
        Drafts <span>{drafts}</span>
      </Link>
    </nav>
  );
}
