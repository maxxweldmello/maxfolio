import type { CSSProperties, ReactNode } from "react";

/* Shared building blocks for the backend flow sections (Authentication → Custom Branding).
   Every section is: title + one-line lede → a visual (pipeline / state machine / receipt)
   → a vertical timeline where each step lists the tables it writes and carries its own
   collapsible curl. Server components only — <details> needs no client JS. */

const PARA: CSSProperties = { fontSize: "13.5px", lineHeight: 1.7, color: "var(--ink-45)" };
const CODE: CSSProperties = { fontSize: "12px", color: "var(--ink)" };

export const M = ({ children }: { children: ReactNode }) => (
  <span className="mono" style={CODE}>{children}</span>
);

export function BackendStyles() {
  return (
    <style>{`
      .bb-curl { margin-top: 10px; }
      .bb-curl > summary {
        list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
        font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-45);
        border: 1px solid var(--rule); border-radius: 999px; padding: 4px 12px;
        transition: color .15s, border-color .15s;
      }
      .bb-curl > summary::-webkit-details-marker { display: none; }
      .bb-curl > summary::before { content: "▸"; font-size: 9px; transition: transform .15s; }
      .bb-curl[open] > summary::before { transform: rotate(90deg); }
      .bb-curl > summary:hover { color: var(--ink); border-color: var(--ink-30); }
      .bb-curl > pre {
        margin: 10px 0 0; background: var(--paper-raised); border: 1px solid var(--rule);
        border-radius: 6px; padding: 12px 14px; font-size: 11.5px; line-height: 1.7;
        color: var(--ink); overflow-x: auto; max-width: 100%;
      }
      .bb-pipe { display: flex; align-items: stretch; overflow-x: auto; padding-bottom: 4px; }
    `}</style>
  );
}

/* ── Section shell ── */
export function Block({ title, lede, children }: { title: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ borderTop: "1px solid var(--rule)", paddingTop: 28 }}>
      <p className="mono" style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 14 }}>
        {title}
      </p>
      {lede && <p style={{ ...PARA, marginBottom: 28 }}>{lede}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>{children}</div>
    </section>
  );
}

export function SubLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mono" style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-30)", marginBottom: 14 }}>
      {children}
    </p>
  );
}

/* ── Curl ── */
export function Curl({ label, code }: { label: string; code: string }) {
  return (
    <details className="bb-curl">
      <summary className="mono">{label}</summary>
      <pre className="mono"><code>{code}</code></pre>
    </details>
  );
}

/* ── Timeline ── */
export type Step = {
  title: string;
  body: ReactNode;
  writes?: string[];
  curls?: { label: string; code: string }[];
};

export function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol>
      {steps.map((s, i) => (
        <li key={s.title} style={{ display: "grid", gridTemplateColumns: "26px minmax(0,1fr)", columnGap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
              className="mono"
              style={{
                width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--ink-30)", background: "var(--paper)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "var(--ink)", flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            {i < steps.length - 1 && <span style={{ flex: 1, width: 1, background: "var(--rule)", marginTop: 6 }} />}
          </div>
          <div style={{ paddingBottom: i < steps.length - 1 ? 30 : 0 }}>
            <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.5, paddingTop: 3 }}>{s.title}</p>
            <p style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--ink-45)", marginTop: 4 }}>{s.body}</p>
            {s.writes && s.writes.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 10 }}>
                <span className="mono" style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-30)", marginRight: 2 }}>writes</span>
                {s.writes.map(w => (
                  <span key={w} className="mono" style={{ fontSize: "10px", padding: "2px 8px", border: "1px dashed var(--ink-30)", borderRadius: 4, color: "var(--ink-45)" }}>{w}</span>
                ))}
              </div>
            )}
            {s.curls && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                {s.curls.map(c => <Curl key={c.label} label={c.label} code={c.code} />)}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── Horizontal pipeline ── */
export function Pipeline({ stages, label, compact = false }: { stages: { name: string; sub?: string }[]; label?: string; compact?: boolean }) {
  return (
    <div>
      {label && <SubLabel>{label}</SubLabel>}
      <div className="bb-pipe" style={compact ? { overflowX: "visible" } : undefined}>
        {stages.map((s, i) => (
          <div
            key={s.name}
            style={{ display: "flex", alignItems: "center", ...(compact ? { flex: "1 1 0", minWidth: 0 } : { flexShrink: 0 }) }}
          >
            <div
              style={{
                border: "1px solid var(--rule)", borderRadius: 6, background: "var(--paper-raised)",
                padding: compact ? "10px 10px" : "10px 14px", minWidth: compact ? 0 : 132, flex: compact ? 1 : undefined,
              }}
            >
              <p className="mono" style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", overflowWrap: "anywhere" }}>{s.name}</p>
              {s.sub && <p className="mono" style={{ fontSize: "9.5px", color: "var(--ink-45)", marginTop: 3, lineHeight: 1.5, overflowWrap: "anywhere" }}>{s.sub}</p>}
            </div>
            {i < stages.length - 1 && <span className="mono" style={{ padding: compact ? "0 4px" : "0 8px", color: "var(--ink-30)", fontSize: "12px", flexShrink: 0 }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Callout ── */
export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ borderLeft: "2px solid var(--accent)", background: "var(--paper-raised)", padding: "14px 18px", borderRadius: "0 6px 6px 0" }}>
      <p className="mono" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 8 }}>{title}</p>
      <div style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--ink-45)" }}>{children}</div>
    </div>
  );
}

/* ── Simple bordered table ── */
export function Table({ head, rows, cols }: { head: string[]; rows: ReactNode[][]; cols?: string }) {
  const template = cols ?? `repeat(${head.length}, minmax(0, 1fr))`;
  return (
    <div style={{ overflowX: "auto", border: "1px solid var(--rule)", borderRadius: 8 }}>
      <div style={{ minWidth: 620 }}>
        <div className="grid" style={{ gridTemplateColumns: template, background: "var(--paper-raised)", borderBottom: "1px solid var(--rule)" }}>
          {head.map((h, i) => (
            <p key={i} className="mono" style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-30)", padding: "12px 16px" }}>{h}</p>
          ))}
        </div>
        {rows.map((r, ri) => (
          <div key={ri} className="grid" style={{ gridTemplateColumns: template, borderBottom: ri < rows.length - 1 ? "1px solid var(--rule)" : "none" }}>
            {r.map((c, ci) => (
              <div key={ci} style={{ fontSize: "12.5px", lineHeight: 1.6, color: ci === 0 ? "var(--ink-45)" : "var(--ink)", padding: "12px 16px" }}>{c}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
