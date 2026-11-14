# Engagement overview: initial audit

This audit covers the existing implementation before the wider dashboard rebuild. The first change is limited to the overview; it does not change tracking, classification or historical records.

## Existing data

- Engagement data is stored as a session per browser tab, page aggregates and deduplicated events. Sessions are not unique people. Logged-in administrators are excluded from the tracking endpoint.
- The browser records page views, selected interactions and actions, maximum scroll milestones, attention increments and case-study chapter observations. The server computes actor and engagement labels from these measurements.
- Attention accrues only after activity while the page is visible and focused. It is batched and flushed on lifecycle events, but page lifecycle interruptions and failed delivery can still leave it incomplete.
- Scroll reach is a position, not reading or completion. It is calculated on initial page load and during scrolling, so a short page can reach the end without recorded attentive time. This can also reflect a quick visit, lost events or automation; the existing data cannot establish the cause of any individual case.
- Actor confidence is heuristic: known user agents and very rapid interaction-free sweeps can be classified as automation, while a single input or chapter observation can classify a session as likely human. Other sessions remain uncertain. This is not proof of identity.
- The existing explored level may be triggered by two pages or scroll reach alone. Engaged and deep levels currently require attention with content-type-dependent supporting signals, or aggregate attention across different content types. These are stored classifications, not proof of consumption.
- Non-blocked submissions are stored independently of engagement sessions. Email delivery can fail after the form is accepted, and manually unblocking an entry removes its blocked flag; a submission cannot be attributed to a session using the present schema.

## Overview changes

- Count only sessions currently classified as likely human for the three engagement metrics. Keep uncertain sessions and the existing combined figures in the detailed reports until their own redesign.
- Display sessions, not people; count tracked page-view events in sessions started in the selected period. Count accepted, non-blocked enquiries separately using submission timestamps.
- Do not calculate a contact conversion rate without session attribution. Do not treat depth as completion.
- Hide shares for denominators below 20. Show a previous-period percentage only for equal-length periods with at least 20 likely-human sessions in each period, at least 20 observations for each compared metric, and an earliest recorded session before the comparison period. This does not establish uninterrupted tracking.
- No data-model, tracking or historical classification changes are made in this phase.

## Follow-up for the measurement phase

Review visibility and focus transitions, residual attention flushing, interrupted mobile sessions, rapid page changes and loss of batched events with representative scenarios. Revisit whether a single interaction or chapter observation is sufficient human evidence and whether the explored classification should require more than page count or scroll. Any change to stored rules or historical interpretation needs explicit definitions, coverage dates and a plan for existing records before implementation.
