import test from "node:test";
import assert from "node:assert/strict";
import { canShowCaseStudyOverview, overviewFromForm, parseCaseStudyOverview } from "../packages/core-domain/src/caseStudyOverview.ts";

test("empty and malformed overviews stay hidden", () => {
  for (const input of ["", "{}", "not json"]) {
    const overview = parseCaseStudyOverview(input);
    assert.equal(overview.eyebrow, "Overview");
    assert.equal(canShowCaseStudyOverview(overview, true), false);
  }
});

test("protected overviews require access unless explicitly made public", () => {
  const form = new FormData();
  form.set("overview_title", " A clear result ");
  const privateOverview = parseCaseStudyOverview(overviewFromForm(form));
  assert.equal(privateOverview.title, "A clear result");
  assert.equal(canShowCaseStudyOverview(privateOverview, false), false);
  assert.equal(canShowCaseStudyOverview(privateOverview, true), true);
  form.set("overview_public", "on");
  assert.equal(canShowCaseStudyOverview(parseCaseStudyOverview(overviewFromForm(form)), false), true);
});

test("any supplied description displays the overview", () => {
  const form = new FormData();
  form.set("overview_situation", "The situation");
  assert.equal(canShowCaseStudyOverview(parseCaseStudyOverview(overviewFromForm(form)), true), true);
});
