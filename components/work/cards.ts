// Work cards: flattened from companies and projects, plus the three palettes used for cards without a picture.

import type { WorkCompany } from "@/lib/types";

// ── flatten companies into a card list ───────────────────────────────────────

export type CardDef =
  | { kind: "project"; id: string; name: string; company: string; description?: string; liveUrl?: string; image?: string }
  | { kind: "task";    id: string; name: string; company: string; projectName: string; image?: string; pageHref?: string };

export function buildCards(companies: WorkCompany[]): CardDef[] {
  const cards: CardDef[] = [];
  for (const company of companies) {
    for (const project of company.projects) {
      if (project.linkOnly) {
        const img = project.walkthroughUrl && !project.walkthroughUrl.endsWith(".mp4") && !project.walkthroughUrl.endsWith(".webm")
          ? project.walkthroughUrl
          : undefined;
        cards.push({ kind: "project", id: project.id, name: project.name, company: company.company, description: project.description, liveUrl: project.liveUrl, image: img || undefined });
      } else {
        for (const task of project.tasks) {
          cards.push({
            kind: "task",
            id: task.id,
            name: task.title || task.id,
            company: company.company,
            projectName: project.name,
            image: task.image,
            pageHref: task.pageHref,
          });
        }
      }
    }
  }
  return cards;
}

// ── 3 palettes + all-6-permutations row table ────────────────────────────────

const PALETTES = [
  { bg: "#0a0a0a", color: "#fff",    border: "none"                       },
  { bg: "#fff",    color: "#0a0a0a", border: "1px solid rgba(0,0,0,0.1)"  },
  { bg: "#f0ece5", color: "#0a0a0a", border: "none"                       },
] as const;

const ROW_PATTERNS = [
  [0, 1, 2],
  [2, 0, 1],
  [1, 2, 0],
  [0, 2, 1],
  [2, 1, 0],
  [1, 0, 2],
] as const;

export function paletteFor(taskIdx: number) {
  const col = taskIdx % 3;
  const row = Math.floor(taskIdx / 3);
  return PALETTES[ROW_PATTERNS[row % 6][col]];
}
