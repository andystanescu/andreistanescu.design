import styles from "./ThreeItemFeatureLayout.module.css";

type FeatureItem = {
  id: string | number;
  title: string;
  description: string;
  media?: string | null;
};

export function ThreeItemFeatureLayout({ items }: { items: FeatureItem[] }) {
  const hasMedia = items.some((item) => Boolean(item.media));

  return (
    <div className={styles.layout}>
      {items.map((item) => (
        <article key={item.id} className={styles.item}>
          {hasMedia && (
            <div className={styles.media}>
              {item.media && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.media} alt="" />
              )}
            </div>
          )}
          <div className={styles.titleRegion}>
            <h3 className="heading-03">{item.title}</h3>
          </div>
          <p className={`body-small ${styles.description}`}>
            {item.description}
          </p>
        </article>
      ))}
    </div>
  );
}
