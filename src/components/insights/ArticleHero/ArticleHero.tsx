import styles from "./ArticleHero.module.css";
import { AuthorAvatar } from "@/components/AuthorAvatar/AuthorAvatar";
import { MediaContainer, type MediaVariant } from "@/components/MediaContainer/MediaContainer";

type ArticleHeroProps = {
  category?: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  dateLabel: string;
  readingMinutes: number;
  coverImage?: string;
  mediaVariant?: MediaVariant;
};

export function ArticleHero({ category, title, excerpt, author, publishedAt, dateLabel, readingMinutes, coverImage, mediaVariant = "wide" }: ArticleHeroProps) {
  return <section className={styles.hero}>
    <p className={`label-eyebrow ${styles.category}`}>{category || "Article"}</p>
    <div className={`${styles.composition} ${!coverImage ? styles.compositionNoMedia : ""}`}>
      <div className={styles.copy}>
        <h1 className={`display-small ${styles.title}`}>{title}</h1>
        <p className={`body-large ${styles.standfirst}`}>{excerpt}</p>
        <div className={styles.byline}>
          <p className={styles.author}><AuthorAvatar author={author} /></p>
          <p className={styles.meta}><time dateTime={publishedAt}>{dateLabel}</time><span aria-hidden="true">·</span><span>{readingMinutes} min read</span></p>
        </div>
      </div>
      {coverImage && <MediaContainer variant={mediaVariant} className={styles.media}>
        {/* Article images are managed by the CMS and do not have stable dimensions at build time. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImage} alt="" />
      </MediaContainer>}
    </div>
  </section>;
}
