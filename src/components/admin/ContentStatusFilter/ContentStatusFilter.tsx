import Link from "next/link";
import styles from "./ContentStatusFilter.module.css";

type ContentStatusFilterProps = {
  baseHref: string;
  current: "all" | "draft";
  total: number;
  drafts: number;
};

export function ContentStatusFilter({ baseHref, current, total, drafts }: ContentStatusFilterProps) {
  return (
    <nav className={styles.filters} aria-label="Filter content by publishing status">
      <Link href={baseHref} aria-current={current === "all" ? "page" : undefined} className={current === "all" ? styles.active : undefined}>
        All content <span>{total}</span>
      </Link>
      <Link href={`${baseHref}?status=draft`} aria-current={current === "draft" ? "page" : undefined} className={current === "draft" ? styles.active : undefined}>
        Drafts <span>{drafts}</span>
      </Link>
    </nav>
  );
}
