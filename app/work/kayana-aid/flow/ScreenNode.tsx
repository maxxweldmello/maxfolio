"use client";

import { Handle, Position } from "@xyflow/react";
import type { FlowStepNode } from "./types";

export type ScreenNodeData = {
  step: FlowStepNode;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
};

type Variant = "form" | "list" | "grid" | "detail";

function pickVariant(category: string | undefined, index: number): Variant {
  const c = (category ?? "").toLowerCase();
  if (/auth|login|start|browse|give/.test(c)) return "form";
  if (/dashboard|progress|confirm|account/.test(c)) return "grid";
  if (/fundraising|team|donations|reports|setup/.test(c)) return "list";
  const cycle: Variant[] = ["form", "list", "grid", "detail"];
  return cycle[index % cycle.length];
}

function MockPreview({ variant }: { variant: Variant }) {
  if (variant === "form") {
    return (
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ height: 5, width: "40%", borderRadius: 2, background: "var(--ink-15)" }} />
        {[0, 1].map((i) => (
          <div key={i} style={{ height: 14, borderRadius: 4, border: "1px solid var(--rule)", background: "var(--paper)" }} />
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ height: 15, width: "60%", borderRadius: 4, background: "var(--accent)", opacity: 0.85 }} />
      </div>
    );
  }
  if (variant === "list") {
    return (
      <div style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--ink-15)", flexShrink: 0 }} />
            <span style={{ height: 5, flex: 1, borderRadius: 2, background: "var(--rule)" }} />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "grid") {
    return (
      <div style={{ padding: "9px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, height: "100%" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ borderRadius: 4, background: i === 0 ? "var(--accent)" : "var(--rule)", opacity: i === 0 ? 0.85 : 1 }} />
        ))}
      </div>
    );
  }
  // detail
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, background: "var(--rule)" }} />
      <div style={{ padding: "6px 12px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ height: 5, width: "55%", borderRadius: 2, background: "var(--ink-15)" }} />
        <div style={{ height: 5, width: "80%", borderRadius: 2, background: "var(--rule)" }} />
      </div>
    </div>
  );
}

export default function ScreenNode({ data }: { data: ScreenNodeData }) {
  const { step, index, selected, onSelect } = data;
  const variant = pickVariant(step.category, index);

  return (
    <div
      onClick={() => onSelect(step.id)}
      className="transition-all"
      style={{
        width: 220,
        cursor: "pointer",
        background: "var(--paper)",
        border: `1.5px solid ${selected ? "var(--accent)" : "var(--rule)"}`,
        borderRadius: 14,
        boxShadow: selected
          ? "0 10px 28px -12px rgba(0,0,0,0.24)"
          : "0 4px 14px -8px rgba(0,0,0,0.12)",
        padding: 12,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "var(--rule)", border: "none", width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: "var(--rule)", border: "none", width: 6, height: 6 }} />

      {/* header */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="mono flex items-center justify-center flex-shrink-0"
          style={{
            width: 18, height: 18, borderRadius: "50%",
            background: selected ? "var(--accent)" : "var(--paper-raised)",
            color: selected ? "var(--paper)" : "var(--ink-45)",
            fontSize: "9.5px", border: selected ? "none" : "1px solid var(--rule)",
          }}
        >
          {index + 1}
        </span>
        <p className="mono truncate" style={{ fontSize: "11.5px", color: "var(--ink)", lineHeight: 1.2 }}>
          {step.title}
        </p>
      </div>

      {/* phone-frame preview */}
      <div
        style={{
          borderRadius: 9,
          border: "1px solid var(--rule)",
          background: "var(--paper-raised)",
          overflow: "hidden",
        }}
      >
        {/* status bar */}
        <div className="flex items-center justify-between px-2.5" style={{ height: 16, background: "var(--paper)" }}>
          <span style={{ fontSize: "7px", color: "var(--ink-30)" }} className="mono">9:41</span>
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((d) => (
              <span key={d} style={{ width: 2.5, height: 2.5, borderRadius: "50%", background: "var(--ink-15)" }} />
            ))}
          </div>
        </div>

        <div style={{ height: 96, position: "relative" }}>
          {step.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={step.image} alt={step.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <>
              {step.category && (
                <span
                  className="mono absolute"
                  style={{ top: 6, left: 12, fontSize: "7.5px", color: "var(--accent)", letterSpacing: "0.05em", zIndex: 1 }}
                >
                  {step.category.toUpperCase()}
                </span>
              )}
              <MockPreview variant={variant} />
            </>
          )}
        </div>
      </div>

      {/* description */}
      <p
        className="mt-2"
        style={{
          fontSize: "10.5px", lineHeight: 1.45, color: "var(--ink-45)",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}
      >
        {step.description}
      </p>
    </div>
  );
}
