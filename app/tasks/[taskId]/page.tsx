import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import tasks from "@/data/tasks.data";
import { workData } from "@/data/work.data";
import { taskImages } from "@/data/taskImage.data";
import { taskScreenshots } from "@/data/screenshots.data";
import Section, { Prose, Points } from "@/components/task/Section";
import {
  Flow,
  Steps,
  Endpoints,
  Verdicts,
  Edges,
  SchemaTable,
  Pull,
  Media,
} from "@/components/task/Bits";
import ScreenshotCarousel from "@/components/task/ScreenshotCarousel";
import { ArrowLeft } from "@/components/icons";

interface PageProps {
  params: Promise<{ taskId: string }>;
}

export function generateStaticParams() {
  return tasks.map((t) => ({ taskId: t.taskId }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { taskId } = await params;
  const task = tasks.find((t) => t.taskId === taskId);
  if (!task) return {};
  return {
    title: task.title,
    description: task.description.replace(/`/g, "").slice(0, 180),
  };
}

function findCompanyContext(projectId: string) {
  for (const company of workData) {
    for (const project of company.projects) {
      if (project.id === projectId) {
        return { companyName: company.company, projectName: project.name };
      }
    }
  }
  return { companyName: "", projectName: "" };
}

export default async function TaskPage({ params }: PageProps) {
  const { taskId } = await params;
  const task = tasks.find((t) => t.taskId === taskId);
  if (!task) return notFound();

  const { companyName, projectName } = findCompanyContext(task.projectId);
  const hero = taskImages[task.taskId];
  const heroList = Array.isArray(hero) ? hero : hero ? [hero] : [];
  const shots = taskScreenshots[task.taskId] ?? [];

  /* Sections are built in the exact order requested, so the ToC and body
     always agree, and a sparse task simply produces fewer of them. */
  const sections: { id: string; title: string; body: React.ReactNode }[] = [];
  const add = (id: string, title: string, body: React.ReactNode) =>
    sections.push({ id, title, body });

  /* 1 · Problem — why it existed */
  if (task.problemStatement)
    add("problem", "Why it existed", <Prose>{task.problemStatement}</Prose>);

  /* 2 · Approach — how I got there */
  if (task.approachToSolve?.length || task.researchAnalysis?.length)
    add(
      "approach",
      "How I got there",
      <div className="space-y-8">
        {task.approachToSolve?.length ? (
          <Steps items={task.approachToSolve} />
        ) : null}
        {task.researchAnalysis?.length ? (
          <div>
            <p
              className="serif text-[15px] mb-3"
              style={{ color: "var(--ink)" }}
            >
              What was weighed
            </p>
            <Verdicts items={task.researchAnalysis} />
          </div>
        ) : null}
      </div>
    );

  /* 3 · How it runs — system flow */
  if (task.ideaPipeline || task.howItWorks || task.systemDesign?.length)
    add(
      "runs",
      "How it runs",
      <div className="space-y-7">
        {task.ideaPipeline && (
          <>
            <Flow steps={task.ideaPipeline.steps} />
            <Prose>{task.ideaPipeline.caption}</Prose>
          </>
        )}
        {task.howItWorks && <Prose>{task.howItWorks}</Prose>}
        {task.systemDesign?.length ? <Points items={task.systemDesign} /> : null}
        {task.requestTrace?.length ? (
          <div>
            <p
              className="serif text-[15px] mb-3"
              style={{ color: "var(--ink)" }}
            >
              One request, end to end
            </p>
            <Steps items={task.requestTrace} />
          </div>
        ) : null}
      </div>
    );

  /* 4 · Data — schema + tables */
  if (task.databaseSchema || task.databaseChanges?.length)
    add(
      "data",
      "Data",
      <div className="space-y-7">
        {task.databaseChanges?.length ? (
          <Points items={task.databaseChanges} />
        ) : null}
        {task.databaseSchema && (
          <>
            <pre className="code-block p-4">
              <code>{task.databaseSchema.ddl}</code>
            </pre>
            <SchemaTable
              headers={task.databaseSchema.sample.headers}
              rows={task.databaseSchema.sample.rows}
            />
            {task.databaseSchema.notes?.length ? (
              <Points items={task.databaseSchema.notes} />
            ) : null}
          </>
        )}
      </div>
    );

  /* 5 · API — endpoints */
  if (task.apiChanges?.length)
    add("api", "The surface", <Endpoints items={task.apiChanges} />);

  /* 7 · Trade-offs — edge cases */
  if (task.errorHandlingEdgeCases?.length || task.constraintsLimitations?.length)
    add(
      "tradeoffs",
      "Trade-offs",
      <div className="space-y-8">
        {task.errorHandlingEdgeCases?.length ? (
          <Edges items={task.errorHandlingEdgeCases} />
        ) : null}
        {task.constraintsLimitations?.length ? (
          <Points items={task.constraintsLimitations} />
        ) : null}
        {task.futureEnhancements?.length ? (
          <Points items={task.futureEnhancements} />
        ) : null}
      </div>
    );

  /* 8 · What it taught */
  if (task.keyInsight || task.conclusion)
    add(
      "taught",
      "What it taught",
      <div className="space-y-7">
        {task.keyInsight && <Pull>{task.keyInsight}</Pull>}
        {task.conclusion && <Prose>{task.conclusion}</Prose>}
      </div>
    );

  return (
    <main className="min-h-screen task-detail-page" style={{ overflowX: "clip", maxWidth: "100vw" }}>
      <style>{`
        @media (max-width: 1023px) {
          .task-detail-page > div:last-child { padding-bottom: 130px !important; }
          .task-detail-page pre {
            max-width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .task-detail-page pre code { white-space: pre; }
          .task-detail-page svg { max-width: 100%; height: auto; }
        }
      `}</style>
      {/* ── Full-width hero image (Unsplash) ── */}
      {task.image && (
        <div style={{ width: "100%", aspectRatio: "5/2", overflow: "hidden" }}>
          <img src={task.image} alt={task.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
        </div>
      )}

      <div className="mx-auto max-w-[1220px] px-6 md:px-10 pt-10 pb-24">

        {/* ── back link ── */}
        <Link
          href="/work"
          className="inline-flex items-center gap-2 transition-colors hover:text-[var(--accent-strong)]"
          style={{ fontSize: "12.5px", color: "var(--ink-30)" }}
        >
          <ArrowLeft size={14} />
          Back to Work
        </Link>

        {/* ── header ── */}
        <header className="mt-8">
          <h1
            className="font-light tracking-tight leading-[1.2]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", color: "var(--ink)" }}
          >
            {task.title}
          </h1>

          <p
            className="mt-5 leading-[1.75]"
            style={{ fontSize: "15.5px", color: "var(--ink-70)" }}
          >
            {task.description.replace(/`/g, "")}
          </p>

        </header>

        {/* ── task screenshots / videos ── */}
        {heroList.length > 0 && (
          <div
            className={`mt-12 grid gap-3 ${heroList.length > 1 ? "sm:grid-cols-2" : ""}`}
          >
            {heroList.map((src, i) => (
              <div
                key={i}
                className="overflow-hidden"
                style={{
                  border: "1px solid var(--rule)",
                  aspectRatio: "16 / 10",
                  background: "var(--paper-sunken)",
                }}
              >
                <Media src={src} alt={`${task.title} — view ${i + 1}`} controls />
              </div>
            ))}
          </div>
        )}

        {/* ── body + rail ── */}
        <div className="mt-16 flex gap-14">
          <div className="min-w-0 flex-1">
            {sections.map((s, i) => (
              <Section key={s.id} id={s.id} index={i + 1} title={s.title}>
                {s.body}
              </Section>
            ))}
          </div>

          {sections.length > 2 && (
            <aside className="hidden lg:block w-[188px] shrink-0">
              <div className="sticky top-28">
                <p className="label mb-4">Contents</p>
                <ol className="space-y-2.5">
                  {sections.map((s, i) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="flex gap-3 text-[13px] transition-colors hover:text-[var(--accent-strong)]"
                        style={{ color: "var(--ink-45)" }}
                      >
                        <span className="mono" style={{ color: "var(--ink-15)" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          )}
        </div>

        <ScreenshotCarousel shots={shots} title={task.title} />
      </div>
    </main>
  );
}
