import styles from "./BeforeAfterComparison.module.css";

type ComparisonImage = { src: string; alt?: string };

export function BeforeAfterComparison({ before, after }: { before: ComparisonImage; after: ComparisonImage }) {
  return (
    <figure className={styles.comparison} aria-label="Before and after comparison">
      <div className={styles.panel}>
        <span>Before</span>
        {/* User-managed uploads are served by the application's upload route. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before.src} alt={before.alt || "Before"} />
      </div>
      <div className={styles.panel}>
        <span>After</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after.src} alt={after.alt || "After"} />
      </div>
    </figure>
  );
}
