"use client";

import { useEffect, useState } from "react";
import { Copy, Check, X } from "@/components/icons";

type CodeItem = {
  code: string;
  path?: string;
  caption?: string;
  language?: string;
  section?: "Frontend" | "Backend";
};

export default function CodeDrawer({ items }: { items: CodeItem[] }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (items.length === 0) return null;

  const active = items[activeIndex] ?? items[0];

  async function copy() {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  }

  const hasSections = items.some((it) => it.section);
  const frontend = items.map((it, i) => ({ it, i })).filter(({ it }) => it.section === "Frontend");
  const backend  = items.map((it, i) => ({ it, i })).filter(({ it }) => it.section === "Backend");
  const unsectioned = items.map((it, i) => ({ it, i })).filter(({ it }) => !it.section);

  function FileBtn({ it, i }: { it: CodeItem; i: number }) {
    const isActive = i === activeIndex;
    const label = it.path ? it.path.split(" — ")[0] ?? it.path : (it.caption ?? `Snippet ${i + 1}`);
    const sub   = it.path?.includes(" — ") ? it.path.split(" — ")[1] : undefined;
    return (
      <button
        onClick={() => setActiveIndex(i)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "10px 16px",
          borderLeft: `2px solid ${isActive ? "var(--ink-45)" : "transparent"}`,
          background: isActive ? "var(--paper-raised)" : "transparent",
          color: isActive ? "var(--ink)" : "var(--ink-45)",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        <p style={{ fontSize: 12.5, fontFamily: "var(--font-mono)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </p>
        {sub && (
          <p style={{ fontSize: 10, color: "var(--ink-30)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2, fontFamily: "var(--font-mono)" }}>
            {sub}
          </p>
        )}
      </button>
    );
  }

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
        title="View code"
        aria-label="View source code"
      >
        <span style={{ fontSize: 13, fontFamily: "var(--font-mono)" }}>&lt;/&gt;</span>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: "var(--font-mono)" }}>
          In Code
        </span>
      </button>

      {/* Mobile launcher */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed right-4 z-40 flex items-center gap-2 transition-colors"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)", padding: "8px 14px", background: "var(--paper-raised)", border: "1px solid var(--rule)", borderRadius: 999, color: "var(--ink-45)", fontSize: 11, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.16em" }}
        title="View code"
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
        style={{ background: "var(--paper)", borderLeft: "1px solid var(--rule)", boxShadow: open ? "-24px 0 60px rgba(0,0,0,0.35)" : "none" }}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Source code"
      >
        {/* Header */}
        <header
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <div className="flex items-baseline gap-3 min-w-0">
            <p className="label shrink-0">In Code</p>
            <p style={{ fontSize: 11.5, color: "var(--ink-30)" }}>
              {items.length} {items.length === 1 ? "file" : "files"}
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

        {/* Two-panel body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left file rail */}
          <nav
            className="shrink-0 overflow-y-auto py-2"
            style={{ width: 200, borderRight: "1px solid var(--rule)" }}
          >
            {hasSections ? (
              <>
                {frontend.length > 0 && (
                  <>
                    <p style={{ padding: "8px 16px 6px", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--ink-30)", fontFamily: "var(--font-mono)" }}>Frontend</p>
                    {frontend.map(({ it, i }) => <FileBtn key={i} it={it} i={i} />)}
                  </>
                )}
                {backend.length > 0 && (
                  <>
                    <p style={{ padding: "16px 16px 6px", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--ink-30)", fontFamily: "var(--font-mono)" }}>Backend</p>
                    {backend.map(({ it, i }) => <FileBtn key={i} it={it} i={i} />)}
                  </>
                )}
                {unsectioned.length > 0 && (
                  <>
                    <p style={{ padding: "16px 16px 6px", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--ink-30)", fontFamily: "var(--font-mono)" }}>Other</p>
                    {unsectioned.map(({ it, i }) => <FileBtn key={i} it={it} i={i} />)}
                  </>
                )}
              </>
            ) : (
              items.map((it, i) => <FileBtn key={i} it={it} i={i} />)
            )}
          </nav>

          {/* Right code pane */}
          <div className="flex-1 overflow-y-auto">
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {active.path && (
                <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-45)", wordBreak: "break-all" }}>
                  {active.path}
                </p>
              )}
              {active.caption && (
                <p style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--ink-70)" }}>
                  {active.caption}
                </p>
              )}
              <div style={{ position: "relative" }}>
                <button
                  onClick={copy}
                  className="absolute top-3 right-3 flex items-center gap-1.5 mono transition-colors"
                  style={{ fontSize: 11, color: copied ? "var(--accent-strong)" : "var(--ink-30)", zIndex: 1 }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <pre className="code-block p-4 overflow-x-auto">
                  <code>{active.code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
