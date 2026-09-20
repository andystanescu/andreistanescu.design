import Link from "next/link";
import { BackButton } from "@/components/BackButton/BackButton";
import { AuthorAvatar } from "@/components/AuthorAvatar/AuthorAvatar";
import { ShareArticle } from "@/components/ShareArticle/ShareArticle";
import { ImpactMetrics, type ImpactMetric } from "@/components/ImpactMetrics/ImpactMetrics";
import { ProjectMetadata } from "@/components/work/ProjectMetadata/ProjectMetadata";
import styles from "./CaseStudyHero.module.css";

type CaseStudyHeroProps = {
  slug: string;
  category?: string;
  company?: string;
  title: string;
  summary: string;
  author: string;
  publicationDetails?: string;
  tags?: string;
  role?: string;
  timeline?: string;
  scope?: string;
  team?: string;
  coverImage?: string;
  impactEyebrow?: string;
  impactTitle?: string;
  metrics: ImpactMetric[];
};

export function CaseStudyHero({ slug, category, company, title, summary, author, publicationDetails, tags, role, timeline, scope, team, coverImage, impactEyebrow = "Impact", impactTitle, metrics }: CaseStudyHeroProps) {
  const descriptors = [category, company]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index);
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <BackButton label="Back to work" fallbackHref="/work" />
          <p className={`body-small ${styles.breadcrumb}`}><Link href="/work">Work</Link>{category && <> &nbsp;/&nbsp; {category}</>}</p>
          <p className={`label-eyebrow ${styles.descriptor}`}>{descriptors.join(" / ") || "Case study"}</p>
          <h1 className={`display-small ${styles.title}`}>{title}</h1>
          <p className={`body-large ${styles.summary}`}>{summary}</p>
          <div className={styles.projectMeta}>
            <p className={`label-eyebrow ${styles.metaLabel}`}>Project meta</p>
            <ProjectMetadata items={[{ label: "Role", value: role || "" }, { label: "Timeline", value: timeline || "" }, { label: "Scope", value: scope || "" }, { label: "Team", value: team || "" }]} />
            <div className={styles.publicationMeta}>
              <AuthorAvatar author={author} />
              {publicationDetails && <p className="body-small">{publicationDetails}</p>}
              {tags && <p className={styles.tags}>{tags}</p>}
            </div>
          </div>
          <ShareArticle title={title} contentType="case_study" contentId={slug} />
        </div>
        {coverImage && <div className={styles.media}>
          {/* Cover images are managed by the CMS and do not have stable dimensions at build time. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt="" />
        </div>}
      </section>
      {metrics.length > 0 && (
        <section className={`${styles.impact} section-dark`} aria-label={`${title} impact`}>
          <div className={`container ${styles.impactInner}`}>
            <div className={styles.impactIntro}>
              <p className={`label-eyebrow ${styles.impactEyebrow}`}>{impactEyebrow}</p>
              {impactTitle && <h2 className={styles.impactTitle}>{impactTitle}</h2>}
            </div>
            <ImpactMetrics metrics={metrics} tone="on-deep" label={`${title} impact metrics`} />
          </div>
        </section>
      )}
    </>
  );
}
