import type { FlowStepEdge, FlowStepNode } from "./types";

const COLUMN_W = 260;
const ROW_H = 320;
const PER_ROW = 4;
const BRANCH_OFFSET = 60;

/** Explicit row layout — positions each row left-to-right at a fixed Y band */
export function layoutFlowRows(
  rowGroups: string[][],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  rowGroups.forEach((ids, rowIndex) => {
    ids.forEach((id, col) => {
      positions.set(id, { x: col * COLUMN_W, y: rowIndex * ROW_H });
    });
  });
  return positions;
}

/**
 * Layered auto-layout: BFS from root nodes (no incoming edges) assigns a
 * topological depth per node. Depths are then wrapped into a dense snaking
 * grid (left-to-right, then right-to-left on the next row, boustrophedon
 * style) instead of one very long horizontal row. Handles branches, merges,
 * and back-edges without overlap or infinite loops.
 */
export function layoutFlow(nodes: FlowStepNode[], edges: FlowStepEdge[]) {
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  nodes.forEach((n) => {
    incoming.set(n.id, []);
    outgoing.set(n.id, []);
  });
  edges.forEach((e) => {
    outgoing.get(e.source)?.push(e.target);
    incoming.get(e.target)?.push(e.source);
  });

  const depth = new Map<string, number>();
  const roots = nodes.filter((n) => (incoming.get(n.id)?.length ?? 0) === 0);
  const queue: string[] = (roots.length ? roots : nodes.slice(0, 1)).map((n) => n.id);
  queue.forEach((id) => depth.set(id, 0));

  let i = 0;
  while (i < queue.length) {
    const id = queue[i++];
    const d = depth.get(id) ?? 0;
    for (const next of outgoing.get(id) ?? []) {
      const nd = depth.get(next);
      if (nd === undefined || nd < d + 1) {
        depth.set(next, d + 1);
        if (!queue.includes(next)) queue.push(next);
      }
    }
  }
  // any unreached node (disconnected) gets appended at the end
  let maxDepth = 0;
  depth.forEach((d) => { if (d > maxDepth) maxDepth = d; });
  nodes.forEach((n) => {
    if (!depth.has(n.id)) depth.set(n.id, ++maxDepth);
  });

  const byDepth = new Map<number, string[]>();
  nodes.forEach((n) => {
    const d = depth.get(n.id) ?? 0;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(n.id);
  });

  const positions = new Map<string, { x: number; y: number }>();
  byDepth.forEach((ids, d) => {
    const gridRow = Math.floor(d / PER_ROW);
    const posInRow = d % PER_ROW;
    const col = gridRow % 2 === 0 ? posInRow : PER_ROW - 1 - posInRow;
    const baseX = col * COLUMN_W;
    const baseY = gridRow * ROW_H;

    ids.forEach((id, branchIndex) => {
      const offset = (branchIndex - (ids.length - 1) / 2) * BRANCH_OFFSET;
      positions.set(id, { x: baseX, y: baseY + offset });
    });
  });

  return positions;
}
