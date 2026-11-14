import test from "node:test";
import assert from "node:assert/strict";
import { advanceExposure, hasHumanEvidence, newExposureState } from "../src/lib/engagementMeasurement.ts";

test("rapid scroll reach is recorded without attentive exposure", () => {
  let state = newExposureState();
  let result = advanceExposure(state, true, false, 1000);
  assert.deepEqual(result.signals, ["exposure_seen"]);
  result = advanceExposure(result.state, false, false, 1000);
  assert.deepEqual(result.signals, []);
  assert.equal(result.state.attended, false);
  assert.equal(hasHumanEvidence(0, 0, 0), false);
});

test("visible attentive time accumulates, but long interruptions are capped", () => {
  let state = newExposureState();
  state = advanceExposure(state, true, true, 0).state;
  let result = advanceExposure(state, true, true, 30000);
  assert.equal(result.state.attentiveMilliseconds, 1500);
  for (let i = 0; i < 4; i++) result = advanceExposure(result.state, true, true, 1000);
  assert.deepEqual(result.signals, ["exposure_attended"]);
  assert.deepEqual(advanceExposure(result.state, true, true, 1000).signals, []);
});

test("inactive intervals do not count, and returning is recorded once", () => {
  let state = advanceExposure(newExposureState(), true, true, 0).state;
  state = advanceExposure(state, true, false, 1000).state;
  state = advanceExposure(state, true, false, 60000).state;
  assert.equal(state.attentiveMilliseconds, 0);
  state = advanceExposure(state, false, false, 0).state;
  let result = advanceExposure(state, true, true, 0);
  assert.deepEqual(result.signals, ["exposure_return"]);
  result = advanceExposure(result.state, false, false, 0);
  assert.deepEqual(advanceExposure(result.state, true, true, 0).signals, []);
});

test("human confidence requires both attention and independent input evidence", () => {
  assert.equal(hasHumanEvidence(0, 4, 4), false);
  assert.equal(hasHumanEvidence(19, 1, 1), false);
  assert.equal(hasHumanEvidence(20, 1, 1), true);
  assert.equal(hasHumanEvidence(5, 2, 2), true);
});
