import styles from "./PageLoading.module.css";

type LoadingKind = "page" | "grid" | "article" | "admin";

const Line = ({ width = "100%", className = "" }: { width?: string; className?: string }) => <span className={`${styles.skeleton} ${styles.line} ${className}`} style={{ width }} />;

export function PageLoading({ kind = "page" }: { kind?: LoadingKind }) {
  if (kind === "admin") return <main className={styles.admin} aria-busy="true" aria-label="Loading admin content">
    <aside className={`${styles.skeleton} ${styles.adminNav}`} />
    <section className={styles.adminContent}><Line width="28%" className={styles.title} /><div className={styles.adminCards}>{Array.from({ length: 4 }, (_, index) => <div className={`${styles.skeleton} ${styles.adminCard}`} key={index} />)}</div><div className={`${styles.skeleton} ${styles.adminPanel}`} /></section>
  </main>;

  return <div className={styles.page} aria-busy="true" aria-label="Loading page">
    <div className={styles.nav}><span className={`${styles.skeleton} ${styles.logo}`} /><span className={`${styles.skeleton} ${styles.navActions}`} /></div>
    <main className={styles.main}>
      <header className={styles.hero}>
        <Line width="18%" />
        <Line width={kind === "article" ? "78%" : "58%"} className={styles.title} />
        <Line width="86%" />
        <Line width="62%" />
      </header>
      {kind === "article" ? <div className={styles.articleLayout}>
        <aside className={`${styles.skeleton} ${styles.articleNav}`} />
        <article className={styles.articleBody}>{Array.from({ length: 8 }, (_, index) => <Line width={index % 3 === 2 ? "68%" : "100%"} key={index} />)}<div className={`${styles.skeleton} ${styles.articleMedia}`} />{Array.from({ length: 4 }, (_, index) => <Line width={index === 3 ? "74%" : "100%"} key={`lower-${index}`} />)}</article>
      </div> : <div className={styles.cards}>
        <div className={`${styles.skeleton} ${styles.featuredCard}`} />
        {Array.from({ length: kind === "grid" ? 6 : 3 }, (_, index) => <div className={styles.card} key={index}><span className={`${styles.skeleton} ${styles.cardMedia}`} /><div className={styles.cardCopy}><Line width="30%" /><Line width="82%" className={styles.cardTitle} /><Line width="100%" /><Line width="70%" /></div></div>)}
      </div>}
    </main>
  </div>;
}
