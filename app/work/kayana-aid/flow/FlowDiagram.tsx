"use client";

import "@xyflow/react/dist/style.css";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import ScreenNode from "./ScreenNode";
import { layoutFlow, layoutFlowRows } from "./autoLayout";
import type { FlowConfig } from "./types";

const nodeTypes: NodeTypes = { screen: ScreenNode };

function FlowLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)", overflowY: "auto", padding: "48px 16px 40px" }}>
      <button onClick={onClose} style={{ position: "fixed", top: 14, right: 18, zIndex: 10000, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 999, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 1100, margin: "0 auto", borderRadius: 10, overflow: "hidden", boxShadow: "0 32px 100px rgba(0,0,0,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "#1e1e1e", borderBottom: "1px solid #2a2a2a" }}>
          <div style={{ display: "flex", gap: 5 }}>{["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}</div>
          <div style={{ flex: 1, height: 20, borderRadius: 4, background: "#141414", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", paddingInline: 8 }}>
            <span style={{ fontFamily: "monospace", fontSize: 9.5, color: "#ccc" }}>kayanaaid.com</span>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={{ width: "100%", display: "block" }} />
      </div>
    </div>
  );
}

function VideoModal({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}
    >
      <button
        onClick={onClose}
        style={{ position: "fixed", top: 14, right: 18, zIndex: 10000, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 999, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
      >✕</button>
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 960, borderRadius: 12, overflow: "hidden", boxShadow: "0 32px 100px rgba(0,0,0,0.7)", background: "#000" }}
      >
        {label && (
          <div style={{ padding: "10px 16px", background: "#111", borderBottom: "1px solid #222" }}>
            <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#999" }}>{label}</span>
          </div>
        )}
        <video
          src={src}
          controls
          autoPlay
          playsInline
          style={{ width: "100%", display: "block", maxHeight: "80vh" }}
        />
      </div>
    </div>
  );
}

export default function FlowDiagram({ config }: { config: FlowConfig }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  /* the detail card floats inside the diagram box; the box grows to fit the card, so a short diagram never crops it. null = resting spot (top right), otherwise where it was dragged */
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cardH, setCardH] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const grab = useRef<{ dx: number; dy: number } | null>(null);

  const positions = useMemo(
    () => config.rowGroups
      ? layoutFlowRows(config.rowGroups)
      : layoutFlow(config.nodes, config.edges),
    [config]
  );

  const flowNodes: Node[] = useMemo(
    () =>
      config.nodes.map((step, index) => ({
        id: step.id,
        type: "screen",
        position: positions.get(step.id) ?? { x: index * 300, y: 0 },
        data: { step, index, selected: step.id === selectedId, onSelect: setSelectedId },
        draggable: true,
      })),
    [config.nodes, positions, selectedId]
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      config.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#bbb", strokeWidth: 1.5 },
        labelStyle: { fontSize: 10.5, fill: "#555", fontFamily: "ui-monospace, monospace", fontWeight: 500 },
        labelBgStyle: { fill: "#ffffff", fillOpacity: 1 },
        labelBgPadding: [8, 5] as [number, number],
        labelBgBorderRadius: 6,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#bbb", width: 16, height: 16 },
      })),
    [config.edges]
  );

  const selected = config.nodes.find((n) => n.id === selectedId) ?? null;
  const selectedIndex = selected ? config.nodes.findIndex((n) => n.id === selected.id) : -1;
  const prevStep = selected ? config.nodes[Math.max(0, selectedIndex - 1)] : null;
  const nextStep = selected ? config.nodes[Math.min(config.nodes.length - 1, selectedIndex + 1)] : null;

  useEffect(() => {
    const el = cardRef.current;
    if (!selected || !el) { setCardH(0); return; }
    setCardH(el.offsetHeight);
    const ro = new ResizeObserver(() => setCardH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [selected]);

  const baseHeight = config.rowGroups ? config.rowGroups.length * 175 + 50 : 560;
  const boxHeight = Math.max(baseHeight, cardH ? cardH + 32 : 0);

  const close = useCallback(() => { setSelectedId(null); setPos(null); }, []);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const card = cardRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    grab.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = grab.current, wrap = wrapRef.current, card = cardRef.current;
    if (!g || !wrap || !card) return;
    const w = wrap.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - w.left - g.dx, 0), Math.max(0, w.width - card.offsetWidth));
    const y = Math.min(Math.max(e.clientY - w.top - g.dy, 0), Math.max(0, w.height - card.offsetHeight));
    setPos({ x, y });
  };
  const endDrag = () => { grab.current = null; setDragging(false); };

  return (
    <div className="relative" ref={wrapRef}>
      {lightboxSrc && <FlowLightbox src={lightboxSrc} alt={selected?.title ?? ""} onClose={() => setLightboxSrc(null)} />}
      <div
        style={{
          height: boxHeight,
          transition: "height .25s ease",
          border: "1px solid var(--rule)",
          borderRadius: 10,
          overflow: "hidden",
          background: "var(--paper-raised)",
        }}
      >
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 40, y: 40, zoom: config.rowGroups ? 0.5 : 1 }}
          minZoom={config.rowGroups ? 0.3 : 1}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          onPaneClick={close}
          zoomOnScroll={false}
          zoomOnPinch={true}
          zoomOnDoubleClick={true}
          preventScrolling={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--rule)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      {/* step detail: a floating card. Drag it by its header anywhere inside the box */}
      {selected && (
        <div
          ref={cardRef}
          className="absolute flex flex-col"
          style={{
            ...(pos ? { left: pos.x, top: pos.y } : { right: 16, top: 16 }),
            width: "min(340px, calc(100% - 32px))",
            maxHeight: "min(78vh, 680px)",
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            borderRadius: 12,
            boxShadow: dragging ? "0 28px 60px -14px rgba(0,0,0,0.42)" : "0 18px 44px -14px rgba(0,0,0,0.32)",
            transform: dragging ? "scale(1.015)" : "none",
            transition: dragging ? "none" : "box-shadow .2s, transform .2s",
            zIndex: 20,
            overflow: "hidden",
          }}
        >
          <div
            className="flex items-start justify-between p-5"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            title="Drag to move"
            style={{ borderBottom: "1px solid var(--rule)", cursor: dragging ? "grabbing" : "grab", touchAction: "none", userSelect: "none" }}
          >
            <div>
              <p className="mono" style={{ fontSize: "10px", color: "var(--accent)", letterSpacing: "0.08em" }}>
                STEP {String(selectedIndex + 1).padStart(2, "0")}
                <span style={{ marginLeft: 10, color: "var(--ink-30)", letterSpacing: "0.2em" }} aria-hidden>⋮⋮</span>
              </p>
              <p className="mono mt-1" style={{ fontSize: "14px", color: "var(--ink)" }}>{selected.title}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="mono flex-shrink-0"
              style={{ fontSize: "16px", color: "var(--ink-45)", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>
            {/* Screenshot image */}
            {selected.image && (
              <div style={{ position: "relative", borderBottom: "1px solid var(--rule)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.image} alt={selected.title} style={{ width: "100%", display: "block", maxHeight: 200, objectFit: "cover", objectPosition: "top" }} />
                <button
                  type="button"
                  onClick={() => setLightboxSrc(selected.image!)}
                  style={{
                    position: "absolute", top: 8, right: 8,
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 11px",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "10.5px", color: "#fff",
                    background: "#111", border: "none",
                    borderRadius: 999, cursor: "pointer",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 4V1h3M7 1h3v3M10 7v3H7M4 10H1V7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Full screen
                </button>
              </div>
            )}
            <div className="p-5">
            {selected.category && (
              <p className="mono mb-3" style={{ fontSize: "10px", color: "var(--ink-30)", letterSpacing: "0.06em" }}>
                {selected.category.toUpperCase()}
              </p>
            )}
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--ink-70)" }}>{selected.description}</p>

            {selected.metadata?.action && (
              <div className="mt-5">
                <p className="label mb-1.5">User action</p>
                <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--ink-70)" }}>{selected.metadata.action}</p>
              </div>
            )}
            {selected.metadata?.result && (
              <div className="mt-5">
                <p className="label mb-1.5">Result</p>
                <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--ink-70)" }}>{selected.metadata.result}</p>
              </div>
            )}

            <div className="mt-6 pt-5 space-y-2" style={{ borderTop: "1px solid var(--rule)" }}>
              {prevStep && prevStep.id !== selected.id && (
                <button
                  type="button"
                  onClick={() => setSelectedId(prevStep.id)}
                  className="mono flex items-center gap-1.5 w-full text-left"
                  style={{ fontSize: "11.5px", color: "var(--ink-45)", background: "none", border: "none", cursor: "pointer" }}
                >
                  ← {prevStep.title}
                </button>
              )}
              {nextStep && nextStep.id !== selected.id && (
                <button
                  type="button"
                  onClick={() => setSelectedId(nextStep.id)}
                  className="mono flex items-center gap-1.5 w-full text-left"
                  style={{ fontSize: "11.5px", color: "var(--ink-45)", background: "none", border: "none", cursor: "pointer" }}
                >
                  {nextStep.title} →
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
