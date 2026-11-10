import Link from "next/link";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { ArticlePreview } from "@/components/insights/ArticlePreview/ArticlePreview";
import { getHomepageInsights } from "@/data/insights";
import { getSection } from "@/lib/homepage";
import { calculateReadingTime } from "@/lib/readingTime";
import { HomepageSectionHeader } from "@/components/home/SectionHeader/HomepageSectionHeader";
import styles from "./LatestInsights.module.css";

export function LatestInsights() {
  const insights = getHomepageInsights();
  const section = getSection("latest_insights")!;
  if (insights.length === 0) return null;

  const [featured, ...supporting] = insights;

  return (
    <section id="latest_insights" className={`${styles.insights} section-dark`}>
      <div className={`container ${styles.insightsInner}`}>
        <HomepageSectionHeader
          eyebrow={section.eyebrow}
          title={section.headline}
          className={styles.sectionHeader}
          action={
            <Link href="/insights" className={styles.seeAll}>
              See all insights
              <ArrowIcon size={16} />
            </Link>
          }
        />

        <div className={styles.editorial}>
          <ArticlePreview
            slug={featured.slug}
            category={featured.category}
            title={featured.title}
            excerpt={featured.excerpt}
            minutes={calculateReadingTime(featured.body)}
            thumbnail={featured.thumbnail_image}
            featured
            headingLevel="h2"
            presentation="editorial"
          />
          {supporting.length > 0 && (
            <div className={styles.supporting}>
              {supporting.map((article) => (
                <ArticlePreview
                  key={article.slug}
                  slug={article.slug}
                  category={article.category}
                  title={article.title}
                  excerpt={article.excerpt}
                  minutes={calculateReadingTime(article.body)}
                  presentation="editorial"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
