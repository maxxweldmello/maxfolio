// ─── Task screenshots ────────────────────────────────────────────────────────
//
// Map of task-id → ordered list of screenshot file paths, rendered as a
// horizontal carousel BELOW the main task detail page content.
//
// • Paths are served from /public — e.g. "/tasks/audit/screenshot-1.png" maps
//   to portfolio/public/tasks/audit/screenshot-1.png.
// • External URLs (e.g. "https://...") are accepted too.
// • Order in the array == order in the carousel.
// • Leave the array empty until screenshots are ready — the section won't render.
// • To add a new task: append a row keyed by the task-id (same string as
//   `taskId` in data/tasks/*.ts).

export const taskScreenshots: Record<string, string[]> = {
  // ── Kayana Admin ──
  "task-audit":                   ["/tasks/audit/screenshot-1.png","/tasks/audit/screenshot-2.png","/tasks/audit/screenshot-3.png","/tasks/audit/screenshot-4.png","/tasks/audit/screenshot-5.png",],
  "task-auth-session":            ["/tasks/auth-session/screenshot-1.png"],
  "task-menus":                   ["/tasks/menus/screenshot-1.png"],
  "task-property-onboarding":     ["/tasks/property-onboarding/screenshot-1.png","/tasks/property-onboarding/screenshot-2.png","/tasks/property-onboarding/screenshot-3.png"],
  "task-compliance":              ["/tasks/compliance/screenshot-1.png","/tasks/compliance/screenshot-2.png","/tasks/compliance/screenshot-3.png"],
  "task-stripe-terminal":         ["/tasks/stripe-terminal/screenshot-1.png","/tasks/stripe-terminal/screenshot-2.png","/tasks/stripe-terminal/screenshot-3.png"],
  "task-stripe-payout-schedule":  ["/tasks/stripe-payout-schedule/screenshot-1.png","/tasks/stripe-payout-schedule/screenshot-2.png","/tasks/stripe-payout-schedule/screenshot-3.png", "/tasks/stripe-payout-schedule/screenshot-4.png","/tasks/stripe-payout-schedule/screenshot-5.png"],
  "task-stripe-instant-payout":   ["/tasks/stripe-instant-payout/screenshot-1.png","/tasks/stripe-instant-payout/screenshot-2.png","/tasks/stripe-instant-payout/screenshot-3.png","/tasks/stripe-instant-payout/screenshot-4.png","/tasks/stripe-instant-payout/screenshot-5.png"],
  "task-payment-fee":             ["/tasks/payment-fee/screenshot-1.png","/tasks/payment-fee/screenshot-2.png","/tasks/payment-fee/screenshot-3.png"],
  "task-card-mapping":            ["/tasks/card-mapping/screenshot-1.png","/tasks/card-mapping/screenshot-2.png","/tasks/card-mapping/screenshot-3.png", "/tasks/card-mapping/screenshot-4.png"],
  "task-knowledge-base":          ["/tasks/knowledge-base/screenshot-1.png","/tasks/knowledge-base/screenshot-2.png","/tasks/knowledge-base/screenshot-3.png"],
  "task-transfer-funds":          ["/tasks/transfer-funds/screenshot-1.png","/tasks/transfer-funds/screenshot-2.png","/tasks/transfer-funds/screenshot-3.png"],
  "task-selective-notifications": ["/tasks/selective-notifications/screenshot-1.mp4","/tasks/selective-notifications/screenshot-2.png","/tasks/selective-notifications/screenshot-3.jpeg", "/tasks/selective-notifications/screenshot-4.png","/tasks/selective-notifications/screenshot-5.png"],

  // ── Kayana Aid ──
};

export default taskScreenshots;
