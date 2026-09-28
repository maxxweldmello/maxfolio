"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";

export type CodeSlide = { file: string; caption: string; code: string };

/* A small slideshow of code, one snippet at a time: a file name, a line about what it does, and the code itself. */
export default function CodeSlides({ slides }: { slides: CodeSlide[] }) {
  const [i, setI] = useState(0);
  const go = (n: number) => setI((n + slides.length) % slides.length);
  const s = slides[i];

  const arrow: React.CSSProperties = {
    width: 34, height: 34, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: "transparent", border: "1px solid var(--rule)", color: "var(--ink-70)", cursor: "pointer",
  };

  return (
    <div className="mt-8" style={{ background: "var(--paper-sunken)", border: "1px solid var(--rule)", maxWidth: 820 }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--rule-soft)" }}>
        <span className="mono truncate" style={{ color: "var(--ink-70)", fontSize: 12 }}>{s.file}</span>
        <span className="mono shrink-0" style={{ color: "var(--ink-30)", fontSize: 11 }}>
          {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
      </div>

      <pre
        className="m-0 overflow-x-auto px-4 py-4"
        style={{ color: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 12.5, lineHeight: 1.65, tabSize: 2 }}
      >
        <code>{s.code}</code>
      </pre>

      <div className="flex items-center gap-4 px-4 py-3" style={{ borderTop: "1px solid var(--rule-soft)" }}>
        <p className="flex-1 text-[13px] leading-[1.6] m-0" style={{ color: "var(--ink-45)" }}>{s.caption}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" aria-label="Previous snippet" style={arrow} onClick={() => go(i - 1)}><ChevronLeft size={14} /></button>
          <button type="button" aria-label="Next snippet" style={arrow} onClick={() => go(i + 1)}><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
