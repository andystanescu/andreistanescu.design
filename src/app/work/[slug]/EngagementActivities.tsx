"use client";

import { useState } from "react";
import { getActivityDescription } from "@/data/caseStudyAssessment";
import styles from "./case-study.module.css";

type Props = {
  visibleActivities: string[];
  additionalActivities: string[];
  conductedActivities: string[];
};

export function EngagementActivities({
  visibleActivities,
  additionalActivities,
  conductedActivities,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const activities = expanded
    ? [...visibleActivities, ...additionalActivities]
    : visibleActivities;
  const additionalCount = additionalActivities.length;

  return (
    <>
      <div className={styles.activityCards} id="additional-engagement-activities">
        {activities.map((item) => {
          const completed = conductedActivities.includes(item);
          return (
            <article className={styles.activityCard} key={item}>
              <div className={styles.activityCardHeader}>
                <h4>{item}</h4>
                <span className={completed ? styles.statusComplete : styles.statusIncomplete}>
                  {completed ? "Complete" : "Not completed"}
                </span>
              </div>
              <p>{getActivityDescription(item)}</p>
            </article>
          );
        })}
      </div>
      {additionalCount > 0 && (
        <div className={styles.activityReveal}>
          <span>+{additionalCount} additional {additionalCount === 1 ? "activity" : "activities"}</span>
          <button
            type="button"
            className={styles.activityRevealButton}
            aria-expanded={expanded}
            aria-controls="additional-engagement-activities"
            onClick={() => setExpanded((current) => !current)}
          >
            <span>{expanded ? "Show fewer activities" : "View all activities"}</span>
            <span className={styles.activityRevealIcon} aria-hidden="true">
              {expanded ? "−" : "+"}
            </span>
          </button>
        </div>
      )}
    </>
  );
}
