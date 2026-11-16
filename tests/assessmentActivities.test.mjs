import test from "node:test";
import assert from "node:assert/strict";
import { getAssessmentActivityCategories, parseCaseStudyAssessment } from "../src/data/caseStudyAssessment.ts";

test("scores alone do not generate activities", () => {
  const assessment = parseCaseStudyAssessment(JSON.stringify({ scores: { discoveryComplexity: 5 } }));
  assert.deepEqual(getAssessmentActivityCategories(assessment), []);
});

test("previously saved activities keep their category, description and completion", () => {
  const assessment = parseCaseStudyAssessment(JSON.stringify({ engagements: { discoveryComplexity: [{ id: "one", title: "Research", description: "Existing detail" }, { id: "two", title: "Review", description: "" }] }, conductedEngagementIds: ["one"] }));
  const categories = getAssessmentActivityCategories(assessment);
  assert.equal(categories[0].title, "Discovery Complexity");
  assert.deepEqual(categories[0].activities.map(({ status }) => status), ["completed", "not_completed"]);
  assert.equal(categories[0].activities[0].description, "Existing detail");
});

test("custom categories and three states survive a round trip, including an empty list", () => {
  const categories = [{ id: "c", title: "Planning", activities: ["completed", "not_completed", "not_started"].map((status) => ({ id: status, title: status, description: "Details", status })) }];
  assert.deepEqual(getAssessmentActivityCategories(parseCaseStudyAssessment(JSON.stringify({ activityCategories: categories }))), categories);
  assert.deepEqual(getAssessmentActivityCategories(parseCaseStudyAssessment(JSON.stringify({ activityCategories: [], likelyEngagement: ["Old activity"] }))), []);
});
