"use client";

import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import { BUCKETS, type Field, type RawEntity } from "./schema-data";

const MONO = "ui-monospace, 'SF Mono', 'Courier New', monospace";
const CARD_BG   = "#141414";
const HEADER_BG = "#1f1f1f";
const BORDER    = "#333333";
const INK       = "#ededed";
const DIM       = "#8a8a8a";
const PK_COLOR  = "#e3b34c";
const FK_COLOR  = "#b5b5b5";
const PLAIN_COLOR = "#5c5c5c";
const EDGE_C    = "rgba(200,200,200,0.4)";

type EntityData = { table: string; fields: Field[] };

function dot(color: string) {
  return <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 1.5, background: color, marginRight: 6, flexShrink: 0 }} />;
}

function EntityNode({ data }: { data: EntityData }) {
  return (
    <div style={{
      width: 232,
      border: `1px solid ${BORDER}`,
      borderRadius: 5,
      background: CARD_BG,
      fontFamily: MONO,
      overflow: "hidden",
      boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
    }}>
      <Handle type="target" position={Position.Top} style={{ background: FK_COLOR, border: "none", width: 5, height: 5 }} />
      <Handle type="source" position={Position.Bottom} style={{ background: FK_COLOR, border: "none", width: 5, height: 5 }} />
      <Handle type="target" position={Position.Left} style={{ background: FK_COLOR, border: "none", width: 5, height: 5 }} />
      <Handle type="source" position={Position.Right} style={{ background: FK_COLOR, border: "none", width: 5, height: 5 }} />

      <div style={{ padding: "6px 9px", background: HEADER_BG, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 10.5, color: INK, fontWeight: 700, letterSpacing: "0.01em" }}>{data.table}</div>
      </div>
      <div style={{ padding: "4px 0" }}>
        {data.fields.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "2px 9px", fontSize: 9, lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden" }}>
            {dot(f.kind === "pk" ? PK_COLOR : f.kind === "fk" ? FK_COLOR : PLAIN_COLOR)}
            <span style={{ color: f.kind === "pk" ? INK : f.kind === "fk" ? "#cfcfcf" : DIM, fontWeight: f.kind === "pk" ? 700 : 400 }}>
              {f.name}
            </span>
            {f.target && <span style={{ color: DIM, marginLeft: 4 }}>&rarr; {f.target}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ColumnLabel({ data }: { data: { label: string } }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", fontWeight: 700,
      color: "#9a9a9a", width: COL_W - 20, pointerEvents: "none",
    }}>
      {data.label}
    </div>
  );
}

const nodeTypes: NodeTypes = { entity: EntityNode, label: ColumnLabel };

/* ── layout: one column per bucket, entities stacked vertically ── */
const COL_W = 320;
const HEADER_H = 26;
const ROW_H = 15.5;
const PAD = 10;
const COL_GAP_Y = 26;

function nodeHeight(e: RawEntity) { return HEADER_H + e.fields.length * ROW_H + PAD; }

type PositionedEntity = RawEntity & { x: number; y: number; bucketLabel: string };

const POSITIONED: PositionedEntity[] = (() => {
  const out: PositionedEntity[] = [];
  BUCKETS.forEach((b, colIdx) => {
    let y = 40;
    b.entities.forEach((e) => {
      out.push({ ...e, x: colIdx * COL_W, y, bucketLabel: b.label });
      y += nodeHeight(e) + COL_GAP_Y;
    });
  });
  return out;
})();

const entityByTable = new Map<string, PositionedEntity>();
POSITIONED.forEach((e) => {
  if (!entityByTable.has(e.table)) entityByTable.set(e.table, e);
});

/* edges derived straight from each entity's fk() fields */
const EDGES: { id: string; source: string; target: string; label: string }[] = [];
POSITIONED.forEach((e) => {
  e.fields.forEach((fld) => {
    if (fld.kind === "fk" && fld.target) {
      const targetEntity = entityByTable.get(fld.target);
      if (targetEntity && targetEntity.id !== e.id) {
        EDGES.push({ id: `${e.id}-${fld.name}-${targetEntity.id}`, source: e.id, target: targetEntity.id, label: fld.name });
      }
    }
  });
});

export default function DatabaseSchema() {
  /* phones and tablets open zoomed in on the first group; desktop keeps fit-to-view */
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => { setMobile(window.innerWidth < 1024); }, []);


  const nodes: Node[] = useMemo(() => {
    const list: Node[] = POSITIONED.map((e) => ({
      id: e.id,
      type: "entity",
      position: { x: e.x, y: e.y },
      data: { table: e.table, fields: e.fields } as EntityData,
      draggable: true,
    }));
    BUCKETS.forEach((b, colIdx) => {
      list.push({
        id: `label-${b.key}`,
        type: "default",
        position: { x: colIdx * COL_W, y: 0 },
        data: { label: b.label.toUpperCase() },
        draggable: false,
        selectable: false,
        style: {
          background: "transparent",
          border: "none",
          color: "#9a9a9a",
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: "0.08em",
          fontWeight: 700,
          width: COL_W - 20,
          padding: 0,
        },
      });
    });
    return list;
  }, []);

  const edges: Edge[] = useMemo(() =>
    EDGES.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: "smoothstep",
      style: { stroke: EDGE_C, strokeWidth: 1 },
      labelStyle: { fontFamily: MONO, fontSize: 7.5, fill: "#8a8a8a" } as React.CSSProperties,
      labelBgStyle: { fill: "#0a0a0a", fillOpacity: 0.92 },
      labelBgPadding: [3, 2] as [number, number],
      labelBgBorderRadius: 2,
      markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_C, width: 8, height: 8 },
    })), []);

  return (
    <div style={{ background: "#0a0a0a", borderRadius: 14, padding: "32px 24px 28px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ marginBottom: 22, paddingLeft: 4 }}>
        <p className="mono" style={{ fontSize: "13px", color: "#ededed", marginBottom: 4, letterSpacing: "0.01em" }}>kayana-aid · database schema &amp; data layer</p>
        <p className="mono" style={{ fontSize: "10px", color: "#8a8a8a", letterSpacing: "0.04em" }}>
          {POSITIONED.length} tables across business-security, security, donation, user &amp; webhook services · grouped by flow · drag / scroll / pinch to explore
        </p>
      </div>

      <style>{`@media (max-width: 1023px) { .schema-canvas { height: 560px !important; } }`}</style>
      <div className="schema-canvas" style={{ height: 460, borderRadius: 10, overflow: "hidden" }}>
        {mobile !== null && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView={!mobile}
          defaultViewport={{ x: 26, y: 16, zoom: 0.72 }}
          fitViewOptions={{ padding: 0.08 }}
          minZoom={0.12}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          zoomOnScroll={false}
          zoomOnPinch
          zoomOnDoubleClick
          preventScrolling={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgba(255,255,255,0.04)" />
          <Controls
            showInteractive={false}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
            }}
          />
        </ReactFlow>
        )}
      </div>
    </div>
  );
}
