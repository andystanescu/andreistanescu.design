import Link from "next/link";
import { ArrowIcon } from "@/components/Icon/ArrowIcon";
import { getInsights } from "@/data/insights";
import { ArticleCard } from "@/components/ArticleCard/ArticleCard";
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

  const [featured] = insights;

  return (
    <AboutSectionShell
      id="latest_insights"
      variant="separated"
      eyebrow={section.eyebrow}
      heading={section.headline}
      intro={section.description}
      action={
          <Link href="/insights" className={styles.seeAll}>
            See all insights
            <ArrowIcon size={16} />
          </Link>
      }
    >
      <div className={`${styles.cards} ${aboutStyles.cards}`}>
          <Link
            href={`/insights/${featured.slug}`}
            className={`${styles.card} section-light`}
          >
            <div
              className={styles.cover}
              style={
                featured.thumbnail_image
                  ? {
                      backgroundImage: `url(${featured.thumbnail_image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
              aria-hidden="true"
            />
            <div className={styles.cardContent}>
              <p className="label-eyebrow" style={{ color: "var(--text-accent)" }}>
                featured article
              </p>
              <h3 className="heading-02">{featured.title}</h3>
              <p className="body-small" style={{ color: "var(--text-secondary)" }}>
                {featured.excerpt}
              </p>
              <span className={styles.link}>
                Read article
                <ArrowIcon size={16} />
              </span>
            </div>
          </Link>

          {insights[1] && (
            <ArticleCard
              slug={insights[1].slug}
              title={insights[1].title}
              excerpt={insights[1].excerpt}
              thumbnail={insights[1].thumbnail_image}
              className="section-light"
            />
          )}
      </div>
    </AboutSectionShell>
  );
}
