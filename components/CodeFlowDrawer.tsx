"use client";

import { useEffect, useState } from "react";
import { X } from "@/components/icons";

type FlowItem = {
  path?: string;
  caption?: string;
  language?: string;
  code: string;
};

/**
 * Side drawer variant of the CodeDrawer that shows every item stacked in
 * one long scroll — no left-hand file rail, no active-tab selection. Used
 * for pipeline-style tasks where the reader wants the whole story in order
 * rather than hopping across tabs.
 *
 * Launcher, backdrop, ESC-to-close, body-scroll-lock, and mobile pill all
 * mirror the tabbed CodeDrawer so both variants read as one control.
 */
export default function CodeFlowDrawer({ items }: { items: FlowItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!items.length) return null;

  return (
    <>
      {/* Fixed right-edge launcher — desktop */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 items-center gap-2 px-3 py-4 transition-colors"
        style={{
          background: "var(--paper-raised)",
          border: "1px solid var(--rule)",
          borderRight: "none",
          borderRadius: "6px 0 0 6px",
          color: "var(--ink-45)",
        }}
        title="View the full flow"
        aria-label="View the full flow"
      >
        <span style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>&lt;/&gt;</span>
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontFamily: "var(--font-mono)",
          }}
        >
          In Code
        </span>
      </button>

      {/* Mobile launcher */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed right-4 z-40 flex items-center gap-2 transition-colors"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",
          padding: "8px 14px",
          background: "var(--paper-raised)",
          border: "1px solid var(--rule)",
          borderRadius: 999,
          color: "var(--ink-45)",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
        }}
        title="View the full flow"
      >
        <span>&lt;/&gt;</span>
        Code
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "color-mix(in srgb, var(--paper-sunken) 65%, transparent)" }}
        aria-hidden
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col w-full sm:w-[640px] lg:w-[820px] xl:w-[920px] transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{
          background: "var(--paper)",
          borderLeft: "1px solid var(--rule)",
          boxShadow: open ? "-24px 0 60px rgba(0,0,0,0.35)" : "none",
        }}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="The flow, end to end"
      >
        <header
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <div className="flex items-baseline gap-3 min-w-0">
            <p className="label shrink-0">In Code</p>
            <p style={{ fontSize: 11.5, color: "var(--ink-30)" }}>
              {items.length} {items.length === 1 ? "stage" : "stages"} · end to end
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="transition-colors hover:text-[var(--accent-strong)]"
            style={{ color: "var(--ink-45)" }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        {/* One long scroll — every stage stacked in order. */}
        <div className="flex-1 overflow-y-auto">
          <ol className="px-6 py-8 space-y-12">
            {items.map((it, i) => (
              <li key={i} className="min-w-0">
                {it.caption && (
                  <p
                    className="mono mb-2"
                    style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.06em" }}
                  >
                    {it.caption}
                  </p>
                )}
                {it.path && (
                  <p
                    className="mono"
                    style={{
                      fontSize: 12.5,
                      color: "var(--ink)",
                      wordBreak: "break-all",
                      marginBottom: 12,
                    }}
                  >
                    {it.path}
                  </p>
                )}
                <pre className="code-block p-4 overflow-x-auto">
                  <code>{it.code}</code>
                </pre>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </>
  );
}
