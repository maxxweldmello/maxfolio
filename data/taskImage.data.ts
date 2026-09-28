// ─── Task hero media ──────────────────────────────────────────────────────────
//
// Map of task-id → hero media file path(s), rendered at the top of every
// task detail page (e.g. /tasks/task-audit). Each row is either a single
// path (image or video) or an array of paths — an array renders side by
// side in a grid instead of one full-width hero.
//
// • Paths are served from /public — e.g. "/tasks/audit/cover.png" maps to
//   the file at portfolio/public/tasks/audit/cover.png.
// • External URLs (e.g. "https://...") are accepted too.
// • The renderer auto-detects image vs. video from the file extension
//   (.mp4/.webm/.mov/.m4v/.ogg → video, anything else → image).
// • Leave the value as "" to render an empty placeholder until the media is ready.
// • To add a new task: append a row keyed by the task-id (same string as
//   `taskId` in data/tasks/*.ts).

export const taskImages: Record<string, string | string[]> = {
  // ── Kayana Admin ──
  "task-audit":                   "/tasks/audit/cover.png",
  "task-auth-session":            "/tasks/auth-session/cover.mov",
  "task-menus":                   "/tasks/menus/cover.mov",
  "task-property-onboarding":     "/tasks/property-onboarding/cover.mov",
  "task-compliance":              "/tasks/compliance/cover.mov",
  "task-stripe-terminal":         "",
  "task-stripe-payout-schedule":  "/tasks/stripe-payout-schedule/cover.mov",
  "task-stripe-instant-payout":   ["/tasks/stripe-instant-payout/cover-1.mov", "/tasks/stripe-instant-payout/cover-2.mov"],
  "task-payment-fee":             "/tasks/payment-fee/cover.mov",
  "task-card-mapping":            "/tasks/card-mapping/cover.mov",
  "task-knowledge-base":          "/tasks/knowledge-base/cover.mov",
  "task-transfer-funds":          "/tasks/transfer-funds/cover.mov",
  "task-selective-notifications": "/tasks/selective-notifications/cover.mov",

  // ── Kayana Aid ──
};

export default taskImages;
