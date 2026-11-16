import Link from "next/link";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { getInsights } from "@/data/insights";
import { ArticlePreview } from "@/components/insights/ArticlePreview/ArticlePreview";
import { calculateReadingTime } from "@/lib/readingTime";
import { getSection } from "@/lib/about";
import { AboutSectionShell } from "@/components/about/AboutSectionShell/AboutSectionShell";
import styles from "@/components/home/LatestInsights/LatestInsights.module.css";
import aboutStyles from "./AboutLatestInsights.module.css";

export function AboutLatestInsights() {
  const insights = getInsights();
  const section = getSection("latest_insights")!;
  if (insights.length === 0) {
    return null;
  }

  const [featured, ...supporting] = insights.slice(0, 3);

  return (
    <AboutSectionShell
      id="latest_insights"
      variant="separated"
      eyebrow={section.eyebrow}
      heading={section.headline}
      intro={section.description}
      action={
          <Link href="/insights" className={styles.seeAll}>
              {section.cta_label || "See all insights"}
            <ArrowIcon size={16} />
          </Link>
      }
    >
      <div className={styles.editorial}>
        <ArticlePreview slug={featured.slug} category={featured.category} title={featured.title} excerpt={featured.excerpt} minutes={calculateReadingTime(featured.body)} thumbnail={featured.thumbnail_image} featured presentation="editorial" />
        {supporting.length > 0 && <div className={`${styles.supporting} ${supporting.length === 1 ? aboutStyles.single : ""}`}>
          {supporting.map((article) => <ArticlePreview key={article.slug} slug={article.slug} category={article.category} title={article.title} excerpt={article.excerpt} minutes={calculateReadingTime(article.body)} presentation="editorial" />)}
        </div>}
      </div>
    </AboutSectionShell>
  );
}
