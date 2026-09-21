import styles from "./FourItemPrinciplesLayout.module.css";

type PrincipleItem = {
  id: string | number;
  title: string;
  description: string;
  media?: string | null;
  number?: string;
};

export function FourItemPrinciplesLayout({ items }: { items: PrincipleItem[] }) {
  const hasMedia = items.some((item) => Boolean(item.media));
  const hasNumbers = items.some((item) => Boolean(item.number));

  return (
    <div className={styles.layout}>
      {items.map((item) => (
        <article key={item.id} className={styles.item}>
          {(hasMedia || hasNumbers) && (
            <div className={styles.meta}>
              {hasMedia && (
                <div className={styles.media}>
                  {item.media && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.media} alt="" />
                  )}
                </div>
              )}
              {item.number && (
                <p className={`mono-token ${styles.number}`}>{item.number}</p>
              )}
            </div>
          )}
          <h3 className="heading-03">{item.title}</h3>
          <p className={`body-small ${styles.description}`}>{item.description}</p>
        </article>
      ))}
    </div>
  );
}
