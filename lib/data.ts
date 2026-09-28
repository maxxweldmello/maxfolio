/**
 * Static data layer — reads from .data.ts files.
 * Import from here in all page server components.
 */

import type {
  SiteSettings,
  WorkCompany,
  WorkProject,
  WorkTask,
  ContactPageData,
  ResumePageData,
} from "./types";
import type { WritingPost, WritingBlock } from "@/data/writings.data";
import { workData, type CompanyItem, type ProjectItem, type TaskItem } from "@/data/work.data";
import tasksData from "@/data/tasks.data";
import { profileData } from "@/data/profile.data";
import { workPageMeta } from "@/data/work-page.data";
import { writings } from "@/data/writings.data";
import { contactPageData } from "@/data/contact-page.data";

export type {
  SiteSettings,
  WorkCompany,
  WorkProject,
  WorkTask,
  WritingPost,
  WritingBlock,
  ContactPageData,
  ResumePageData,
};

// ── Work / Career ────────────────────────────────────────────────────────────

export async function getCompanies(): Promise<WorkCompany[]> {
  return (workData as CompanyItem[]).map((c): WorkCompany => ({
    id:          c.company.toLowerCase().replace(/\s+/g, "-"),
    company:     c.company,
    role:        c.role,
    start:       c.start,
    end:         c.end,
    description: c.description,
    contributions: c.contributions,
    projects: (c.projects as ProjectItem[]).map((p): WorkProject => ({
      id:             p.id,
      name:           p.name,
      description:    p.description,
      start:          p.start,
      end:            p.end,
      linkOnly:       p.linkOnly,
      liveUrl:        p.liveUrl,
      liveUrlLabel:   p.liveUrlLabel,
      walkthroughUrl: p.walkthroughUrl,
      tasks: (p.tasks as TaskItem[] ?? []).map((t): WorkTask => {
        const detail = t.hasDetail
          ? tasksData.find((td) => td.taskId === t.id)
          : undefined;
        return {
          id:          t.id,
          hasDetail:   t.hasDetail,
          title:       detail?.title ?? t.title,
          description: detail?.description ?? t.description,
          start:       t.start,
          end:         t.end,
          image:       t.image ?? detail?.image,
          pageHref:    t.pageHref,
        };
      }),
    })),
  }));
}

// ── Site Settings ────────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings> {
  const p = profileData;
  const w = workPageMeta;

  return {
    name:     p.name,
    brand:    p.brand,
    bio:      p.about ?? "",
    location: p.location,
    email:    `${p.email.username}@${p.email.domain}`,
    role:     p.role,
    home: {
      heroImage:     p.home.heroImage,
      headline:      p.home.headline,
      ctas:          p.home.ctas,
      footerCaption: p.home.footerCaption,
    },
    workPage: {
      eyebrow:        w.eyebrow,
      titleLines:     Array.isArray(w.titleLines) ? w.titleLines : [...w.titleLines],
      standfirst:     w.standfirst,
      experienceStat: w.experienceStat,
    },
  };
}

// ── Writing Posts ────────────────────────────────────────────────────────────

export async function getWritingPosts(): Promise<WritingPost[]> {
  return writings as WritingPost[];
}

export async function getWritingPost(slug: string): Promise<WritingPost | null> {
  return (writings as WritingPost[]).find((w) => w.slug === slug) ?? null;
}

// ── Contact Page ─────────────────────────────────────────────────────────────

export async function getContactPage(): Promise<ContactPageData> {
  return { ...contactPageData, links: [...contactPageData.links] };
}

// ── Resume Page ──────────────────────────────────────────────────────────────

// Hosted on Google Drive so the PDF can be swapped without a redeploy —
// just replace the file in Drive, sharing stays "Anyone with the link".
const RESUME_DRIVE_ID = "1oMYcRRxC9uuNNfq6PnSYF9NVvNUMogtK";

export async function getResumePage(): Promise<ResumePageData> {
  return {
    // proxied through our own server (see app/api/drive-file) so the browser's
    // native PDF viewer renders it — same clean fit-to-width as the old local file.
    pdfUrl:           `/api/drive-file?id=${RESUME_DRIVE_ID}`,
    downloadUrl:      `/api/drive-file?id=${RESUME_DRIVE_ID}`,
    downloadFilename: "Maxwel_DMello_Software_Engineer_Resume.pdf",
    updatedAt:        "2026",
  };
}
