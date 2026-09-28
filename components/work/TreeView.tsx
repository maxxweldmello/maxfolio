"use client";

import { useState } from "react";
import type { WorkCompany } from "@/lib/types";
import { Expand } from "@/components/icons";
import { ImageLightbox } from "@/components/task/ImageLightbox";

type Entry =
  | { kind: "project"; name: string; description?: string; company: string; role: string; taskCount: number; start: string; end: string; showCompany: boolean; contributions?: WorkCompany["contributions"] }
  | { kind: "task";    name: string; description?: string; company: string; projectName: string; start?: string; end?: string; projectStart: string; projectEnd: string; showCompany: boolean };

function fmt(ym: string) {
  if (ym === "present") return "Present";
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function isPresent(entry: Entry) {
  if (entry.kind === "project") return entry.end === "present";
  return (entry as any).projectEnd === "present";
}

function buildEntries(companies: WorkCompany[]): Entry[] {
  const out: Entry[] = [];
  for (const company of [...companies].reverse()) {
    let firstOfCompany = true;
    for (const project of company.projects) {
      out.push({
        kind: "project",
        name: project.name,
        description: project.description,
        company: company.company,
        role: company.role,
        taskCount: project.tasks.length,
        start: project.start ?? company.start,
        end: project.end ?? company.end,
        showCompany: firstOfCompany,
        contributions: firstOfCompany ? company.contributions : undefined,
      });
      firstOfCompany = false;
      if (!project.linkOnly) {
        for (const task of project.tasks) {
          out.push({
            kind: "task",
            name: task.title || task.id,
            description: task.description,
            company: company.company,
            projectName: project.name,
            start: task.start,
            end: task.end,
            projectStart: project.start ?? company.start,
            projectEnd: project.end ?? company.end,
            showCompany: false,
          });
        }
      }
    }
  }
  return out;
}

const LABEL: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: "var(--ink-30)",
};

export default function TreeView({ companies }: { companies: WorkCompany[] }) {
  const entries = buildEntries(companies);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Flattened across every company's contribution years, in the order they render,
  // so the lightbox can step between them regardless of which company they belong to.
  const allContributionImages = entries.flatMap((e) =>
    e.kind === "project" ? (e.contributions ?? []).map((c) => c.image) : []
  );

  return (
    <>
    {lightboxIndex !== null && (
      <ImageLightbox
        images={allContributionImages}
        index={lightboxIndex}
        title="GitHub contributions"
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    )}
    <div
      className="tree-container"
      style={{
        maxWidth: 980,
        margin: "0 auto",
        paddingTop: "clamp(80px, 12vh, 140px)",
        paddingBottom: "clamp(80px, 12vh, 140px)",
        paddingLeft: "clamp(16px, 3vw, 40px)",
        paddingRight: "clamp(16px, 3vw, 40px)",
        position: "relative",
      }}
    >
      {/* Single continuous vertical line */}
      <div className="tree-line" style={{ position: "absolute", top: 0, bottom: 0, left: "calc(50% - 0.5px)", width: 1, background: "var(--rule)" }} />
      {entries.map((entry, i) => {
        const isProject = entry.kind === "project";
        const isLast = i === entries.length - 1;
        const firstPresent = isPresent(entry) && (i === 0 || !isPresent(entries[i - 1]));

        const dateStr = isProject
          ? `${fmt(entry.start)} — ${fmt(entry.end)}`
          : entry.start
            ? `${fmt(entry.start)} — ${fmt((entry as { end?: string }).end ?? (entry as { projectEnd: string }).projectEnd)}`
            : null;

        return (
          <div key={i}>
            {/* ── Company header — centered across the line ── */}
            {entry.showCompany && (
              <>
                {i > 0 && <div style={{ height: "clamp(32px, 5vh, 56px)" }} />}
                {/* Company name row */}
                <div className="tree-company-row" style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", paddingBottom: "clamp(16px, 2.5vh, 28px)" }}>
                  <div />
                  <div />
                  <div className="tree-company-cell" style={{ paddingLeft: 40, display: "flex", flexDirection: "column", gap: 16 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(1.1rem, 1.8vw, 1.8rem)",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        color: "var(--ink)",
                        lineHeight: 1,
                      }}
                    >
                      {entry.company}
                    </p>

                    {(entry as { contributions?: WorkCompany["contributions"] }).contributions?.length ? (
                      <div className="tree-contributions" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        {(entry as { contributions: NonNullable<WorkCompany["contributions"]> }).contributions.map((c) => (
                          <div key={c.year} style={{ border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden", background: "var(--paper-raised)" }}>
                            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--rule)", display: "flex", alignItems: "baseline", gap: 6 }}>
                              <span style={{ ...LABEL, color: "var(--ink-45)" }}>GitHub · {c.year}</span>
                              {c.total != null && (
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-30)" }}>
                                  {c.total.toLocaleString()} contributions
                                </span>
                              )}
                            </div>
                            <div style={{ position: "relative" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={c.image}
                                alt={`GitHub contribution graph, ${c.year}`}
                                style={{ display: "block", width: "100%", maxWidth: 420, height: "auto" }}
                              />
                              <button
                                type="button"
                                onClick={() => setLightboxIndex(allContributionImages.indexOf(c.image))}
                                aria-label={`Expand ${c.year} contribution graph`}
                                style={{
                                  position: "absolute", top: 8, right: 8,
                                  width: 26, height: 26, borderRadius: 6,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.2)",
                                  color: "#fff", cursor: "pointer",
                                }}
                              >
                                <Expand size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            )}

          <div
            className="tree-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1px 1fr",
              minHeight: isProject
                ? "clamp(160px, 22vh, 260px)"
                : "clamp(100px, 14vh, 160px)",
            }}
          >
            {/* ── LEFT: date + entry name ────────────────── */}
            <div
              className="tree-left"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingRight: 40,
                paddingTop: 20,
                paddingBottom: 20,
              }}
            >
              <p style={{ ...LABEL, textAlign: "right" as const, marginBottom: 4 }}>
                {isProject ? "Project" : "Task"}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(0.85rem, 1.4vw, 1.1rem)",
                  fontWeight: isProject ? 500 : 400,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                  color: "var(--ink)",
                  opacity: isProject ? 0.8 : 0.55,
                  textAlign: "right" as const,
                }}
              >
                {entry.name}
              </p>
            </div>

            {/* ── CENTER: dot ─────────────────────── */}
            <div className="tree-dot" style={{ position: "relative" }}>
              {isProject && isPresent(entry) ? (
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                }}>
                  {/* pulse rings */}
                  <span style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%) rotate(45deg)",
                    width: 11, height: 11,
                    background: "var(--ink)",
                    animation: "diamond-pulse 2s ease-out infinite",
                    display: "block",
                  }} />
                  <span style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%) rotate(45deg)",
                    width: 11, height: 11,
                    background: "var(--ink)",
                    animation: "diamond-pulse 2s ease-out infinite 0.6s",
                    display: "block",
                  }} />
                  {/* solid diamond */}
                  <span style={{
                    position: "relative", display: "block",
                    width: 11, height: 11,
                    background: "var(--ink)",
                    transform: "rotate(45deg)",
                  }} />
                </div>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: isProject
                      ? "translate(-50%, -50%) rotate(45deg)"
                      : "translate(-50%, -50%)",
                    width: isProject ? 11 : 6,
                    height: isProject ? 11 : 6,
                    borderRadius: isProject ? 2 : "50%",
                    background: isProject ? "var(--ink)" : "transparent",
                    border: isProject ? "none" : "1.5px solid var(--ink-30)",
                  }}
                />
              )}
            </div>

            {/* ── RIGHT: meta + description ──────────────── */}
            <div
              className="tree-right"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingLeft: 40,
                paddingTop: 20,
                paddingBottom: 20,
              }}
            >
              {dateStr && (
                <p style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(0.8rem, 1.1vw, 1rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                  opacity: 0.5,
                  marginBottom: 10,
                }}>{dateStr}</p>
              )}
              {entry.description && (
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: isProject
                      ? "clamp(0.85rem, 1.2vw, 1rem)"
                      : "clamp(0.76rem, 1vw, 0.85rem)",
                    lineHeight: 1.72,
                    color: "var(--ink)",
                    opacity: 0.6,
                  }}
                >
                  {entry.description}
                </p>
              )}

              {isProject && (entry as { taskCount: number }).taskCount > 0 && (
                <p style={{ ...LABEL, marginTop: 12 }}>
                  {(entry as { taskCount: number }).taskCount} tasks
                </p>
              )}
            </div>
          </div>
          </div>
        );
      })}
      <style>{`
        @keyframes diamond-pulse {
          0%   { transform: translate(-50%, -50%) rotate(45deg) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) rotate(45deg) scale(3.2); opacity: 0; }
        }
        @media (max-width: 1023px) {
          .tree-container {
            padding-left: 40px !important;
            padding-right: 20px !important;
            padding-top: 48px !important;
            padding-bottom: 60px !important;
          }
          .tree-line { left: 18px !important; }
          .tree-company-row {
            grid-template-columns: 1fr !important;
            padding-bottom: 12px !important;
          }
          .tree-company-cell {
            padding-left: 0 !important;
            grid-column: 1 / -1;
          }
          .tree-row {
            grid-template-columns: 1fr !important;
            min-height: 0 !important;
            padding: 18px 0 !important;
            position: relative;
          }
          .tree-left {
            padding: 0 0 6px 0 !important;
          }
          .tree-left p { text-align: left !important; }
          .tree-dot {
            position: absolute !important;
            left: -32px !important;
            top: 26px !important;
            width: 20px;
            height: 20px;
          }
          .tree-right { padding: 0 !important; }
        }
      `}</style>
    </div>
    </>
  );
}
