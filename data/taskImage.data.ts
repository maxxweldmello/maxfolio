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
  "task-auth-session":            "/api/drive-video?id=11RQqVyA__WgJUJ8gsaTED8iVzkIkcDU0#.mov",
  "task-menus":                   "/api/drive-video?id=1vQOGf12n_xD-A2tdzTByH_QmLvy53AZB#.mov",
  "task-property-onboarding":     "/api/drive-video?id=1FjDR5X9ppYEDU2rK_BeS2UqfAtEC7SE6#.mov",
  "task-compliance":              "/api/drive-video?id=1yPgSA8LGa-OTFevNBgVrYupVY1djozcv#.mov",
  "task-stripe-terminal":         "",
  "task-stripe-payout-schedule":  "/api/drive-video?id=1wJvDLGcvh_7pcDVBOx1_y3seAPrmqakW#.mov",
  "task-stripe-instant-payout":   ["/api/drive-video?id=1-lvktE-TPGqsoYYMHVMeZbIJJdYj7afQ#.mov", "/api/drive-video?id=14tkX-XkLAXKWsgjVlIIMniIvuHRno90Q#.mov"],
  "task-payment-fee":             "/api/drive-video?id=1gBfTatO8tl7-TOBaxRSar8hrLgRXBO5s#.mov",
  "task-card-mapping":            "/api/drive-video?id=1OHH_dQqfH2AFC5cx5udqYvUWtftCQMoR#.mov",
  "task-knowledge-base":          "/api/drive-video?id=1QtPf2ftaRaGCxRpJrOgrk4oI39v5JEH0#.mov",
  "task-transfer-funds":          "/api/drive-video?id=1fdKBCckqxIw_0MXgxWbxoA3TxY8To8ZS#.mov",
  "task-selective-notifications": "/api/drive-video?id=1JR4z_z-KF3bKSZ-61tz7FkkZdM70Fpd6#.mov",

  // ── Kayana Aid ──
};

export default taskImages;
