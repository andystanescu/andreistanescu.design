"use client";

import { useState } from "react";
import type { EditableEngagement } from "@/data/caseStudyAssessment";
import styles from "./case-study.module.css";

type Props = {
  visibleActivities: EditableEngagement[];
  additionalActivities: EditableEngagement[];
  conductedActivities: string[];
  conductedEngagementIds: string[];
};

export function EngagementActivities({
  visibleActivities,
  additionalActivities,
  conductedActivities,
  conductedEngagementIds,
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
          const completed = conductedEngagementIds.includes(item.id) || conductedActivities.includes(item.title);
          return (
            <article className={styles.activityCard} key={item.id}>
              <div className={styles.activityCardHeader}>
                <h4>{item.title}</h4>
                <span className={completed ? styles.statusComplete : styles.statusIncomplete}>
                  {completed ? "Complete" : "Not completed"}
                </span>
              </div>
              <p>{item.description}</p>
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
