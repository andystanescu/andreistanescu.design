import styles from "./ProjectMetadata.module.css";

export type ProjectMetadataItem = { label: string; value: string };

export function ProjectMetadata({ items }: { items: ProjectMetadataItem[] }) {
  const visibleItems = items.filter((item) => item.value.trim());
  if (visibleItems.length === 0) return null;
  return (
    <dl className={styles.grid}>
      {visibleItems.map((item) => (
        <div className={item.value.length > 42 ? styles.wide : undefined} key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
