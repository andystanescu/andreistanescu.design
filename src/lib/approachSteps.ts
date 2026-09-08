import { db } from "@/lib/db";

export type ApproachStep = {
  id: number;
  title: string;
  description: string;
  icon: string;
  show_on_homepage: number;
  position: number;
  published: number;
};

export function getApproachSteps(): ApproachStep[] {
  return db
    .prepare("SELECT * FROM approach_steps WHERE published = 1 ORDER BY position ASC")
    .all() as ApproachStep[];
}

export function getAllApproachStepsAdmin(): ApproachStep[] {
  return db
    .prepare("SELECT * FROM approach_steps ORDER BY position ASC")
    .all() as ApproachStep[];
}

export function getHomepageApproachSteps(): ApproachStep[] {
  return db
    .prepare(
      "SELECT * FROM approach_steps WHERE published = 1 AND show_on_homepage = 1 ORDER BY position ASC"
    )
    .all() as ApproachStep[];
}
