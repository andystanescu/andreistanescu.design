/** Versioned measurement rules for newly created sessions. */
export const MEASUREMENT_VERSION = 2;
export const EXPOSURE_RULES = { attendedMilliseconds: 5_000, maxSampleMilliseconds: 1_500, maxSections: 40 } as const;

export type ExposureState = { visible: boolean; active: boolean; seen: boolean; exited: boolean; returned: boolean; attended: boolean; attentiveMilliseconds: number };
export type ExposureSignal = "exposure_seen" | "exposure_attended" | "exposure_return";
export function newExposureState(): ExposureState { return { visible: false, active: false, seen: false, exited: false, returned: false, attended: false, attentiveMilliseconds: 0 }; }

/** Credit only intervals sampled visible and active at both ends; cap gaps caused by suspended browsers. */
export function advanceExposure(state: ExposureState, visible: boolean, active: boolean, elapsedMilliseconds: number): { state: ExposureState; signals: ExposureSignal[] } {
  const next = { ...state };
  const signals: ExposureSignal[] = [];
  if (visible && !state.visible) {
    if (!state.seen) { next.seen = true; signals.push("exposure_seen"); }
    else if (state.exited && !state.returned) { next.returned = true; signals.push("exposure_return"); }
  }
  if (!visible && state.visible && state.seen) next.exited = true;
  if (visible && state.visible && active && state.active && !state.attended) {
    next.attentiveMilliseconds += Math.max(0, Math.min(elapsedMilliseconds, EXPOSURE_RULES.maxSampleMilliseconds));
    if (next.attentiveMilliseconds >= EXPOSURE_RULES.attendedMilliseconds) { next.attended = true; signals.push("exposure_attended"); }
  }
  next.visible = visible;
  next.active = active;
  return { state: next, signals };
}

/** New sessions need attention plus input, or two kinds of input plus some attention. */
export function hasHumanEvidence(activeSeconds: number, interactionCount: number, distinctInputTypes: number): boolean {
  return (activeSeconds >= 20 && interactionCount >= 1) || (activeSeconds >= 5 && distinctInputTypes >= 2);
}
