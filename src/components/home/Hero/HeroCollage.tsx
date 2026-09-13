import { getCaseStudies } from "@/data/caseStudies";
import { getInsights } from "@/data/insights";
import { getSettings } from "@/lib/settings";
import type { CSSProperties } from "react";
import styles from "./HeroCollage.module.css";

type CollageItem = {
  kind: "case-study" | "insight" | "profile";
  slug: string;
  title: string;
  image: string;
};

export function HeroCollage() {
  const caseStudies: CollageItem[] = getCaseStudies()
    .slice(0, 4)
    .map((study) => ({
      ...study,
      image: study.thumbnail_image || study.cover_image,
    }))
    .filter((study) => study.image)
    .map((study) => ({
      kind: "case-study",
      slug: study.slug,
      title: study.title,
      image: study.image,
    }));

  const insights: CollageItem[] = getInsights()
    .slice(0, 3)
    .map((insight) => ({
      ...insight,
      image: insight.thumbnail_image || insight.cover_image,
    }))
    .filter((insight) => insight.image)
    .map((insight) => ({
      kind: "insight",
      slug: insight.slug,
      title: insight.title,
      image: insight.image,
    }));

  const profileImage = getSettings().about_hero_image;
  const profile: CollageItem[] = profileImage
    ? [
        {
          kind: "profile",
          slug: "profile",
          title: "Andrei Stanescu",
          image: profileImage,
        },
      ]
    : [];

  const items = [...caseStudies, ...insights, ...profile];
  if (items.length === 0) return null;

  return (
    <div className={styles.collage} aria-hidden="true">
      {items.map((item, index) => (
        <div
          className={`${styles.tile} ${styles[`tile${index + 1}`] ?? ""} ${item.kind === "profile" ? styles.profileTile : ""}`}
          key={`${item.kind}-${item.slug}`}
          style={
            {
              "--light-opacity": (0.3 + Math.random() * 0.1).toFixed(3),
              "--dark-opacity": (0.25 + Math.random() * 0.1).toFixed(3),
            } as CSSProperties
          }
        >
          <img src={item.image} alt="" loading={index < 4 ? "eager" : "lazy"} />
        </div>
      ))}
      <div className={styles.scrim} />
    </div>
  );
}
