"use client";

import { useState } from "react";
import { Copy, Check } from "@/components/icons";

/**
 * Code is presented as a quiet plate: a filename rail on top, the source below,
 * no syntax colour. On paper-like surfaces colour-per-token reads as noise —
 * the structure of the code carries enough.
 */
export default function Code({
  code,
  path,
  caption,
  language,
}: {
  code: string;
  path?: string;
  caption?: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — the code is selectable anyway */
    }
  };

  return (
    <figure className="my-6">
      {(path || language) && (
        <div
          className="flex items-center justify-between gap-4 px-3 py-2 border border-b-0"
          style={{
            borderColor: "var(--rule-soft)",
            background: "var(--paper-raised)",
          }}
        >
          <span className="mono truncate" style={{ color: "var(--ink-45)" }}>
            {path ?? language}
          </span>
          <button
            onClick={copy}
            className="shrink-0 flex items-center gap-1.5 mono transition-colors"
            style={{ color: copied ? "var(--accent)" : "var(--ink-30)" }}
            aria-label="Copy code"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <pre className="code-block p-4">
        <code>{code}</code>
      </pre>

      {caption && (
        <figcaption
          className="mt-2.5 text-[12.5px] leading-relaxed"
          style={{ color: "var(--ink-45)" }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
