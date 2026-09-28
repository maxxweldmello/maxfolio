// ─── Types ────────────────────────────────────────────────────────────────────

import { taskAudit } from "./tasks/task-audit";
import { taskAuthSession } from "./tasks/task-auth-session";
import { taskMenus } from "./tasks/task-menus";
import { taskPropertyOnboarding } from "./tasks/task-property-onboarding";
import { taskStripeTerminal } from "./tasks/task-stripe-terminal";
import { taskStripePayoutSchedule } from "./tasks/task-stripe-payout-schedule";
import { taskStripeInstantPayout } from "./tasks/task-stripe-instant-payout";
import { taskPaymentFee } from "./tasks/task-payment-fee";
import { taskCardMapping } from "./tasks/task-card-mapping";
import { taskKnowledgeBase } from "./tasks/task-knowledge-base";
import { taskTransferFunds } from "./tasks/task-transfer-funds";
import { taskSelectiveNotifications } from "./tasks/task-selective-notifications";
import { taskCompliance } from "./tasks/task-compliance";

export type TaskStatus = "completed" | "in-progress" | "archived";
export type TaskRole   = "solo" | "lead" | "contributor";

export type Task = {
  taskId:     string;
  projectId:  string;
  status:     TaskStatus;
  role:       TaskRole;
  techTags:   string[];
  image?:     string;

  title:                    string;
  description:              string;
  /** Flow pill bar + one-line caption rendered as the "Idea" section. */
  ideaPipeline?:            { steps: string[]; caption: string };
  problemStatement?:        string;
  howItWorks?:              string;
  codeExample?:             { path?: string; caption?: string; language?: string; code: string; section?: "Frontend" | "Backend" }[];
  /**
   * When true, `codeExample` renders as an inline top-to-bottom flow of stages
   * on the task page instead of the tabbed CodeDrawer. Use for pipeline-style
   * write-ups (task-audit, etc) where the reader wants to scroll one long story.
   */
  codeInline?:              boolean;
  requestTrace?:            { phase: string; detail: string }[];
  keyInsight?:              string;
  researchAnalysis?:        { option: string; verdict: "picked" | "rejected"; reason: string }[];
  approachToSolve?:         { step: string; detail: string }[];
  systemDesign?:            string[];
  databaseChanges?:         string[];
  databaseSchema?: {
    ddl: string;
    sample: { headers: string[]; rows: string[][] };
    notes?: string[];
  };
  apiChanges?:              { method: string; path: string; note?: string; response?: string }[];
  constraintsLimitations?:  string[];
  errorHandlingEdgeCases?:  { title: string; note: string }[];
  futureEnhancements?:      string[];
  conclusion?:              string;
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasks: Task[] = [

  // ── task-audit ───────────────────────────────────────────────────────────
  taskAudit,

  // ── task-auth-session ─────────────────────────────────────────────────────
  taskAuthSession,

  // ── task-menus ────────────────────────────────────────────────────────────
  taskMenus,

  // ── task-property-onboarding ──────────────────────────────────────────────
  taskPropertyOnboarding,

  // ── task-compliance ───────────────────────────────────────────────────────
  taskCompliance,

  // ── task-stripe-terminal ──────────────────────────────────────────────────
  taskStripeTerminal,

  // ── task-stripe-payout-schedule ───────────────────────────────────────────
  taskStripePayoutSchedule,

  // ── task-stripe-instant-payout ────────────────────────────────────────────
  taskStripeInstantPayout,

  // ── task-payment-fee ──────────────────────────────────────────────────────
  taskPaymentFee,

  // ── task-card-mapping ─────────────────────────────────────────────────────
  taskCardMapping,

  // ── task-knowledge-base ───────────────────────────────────────────────────
  taskKnowledgeBase,

  // ── task-transfer-funds ───────────────────────────────────────────────────
  taskTransferFunds,

  // ── task-selective-notifications ──────────────────────────────────────────
  taskSelectiveNotifications,
];

export default tasks;
