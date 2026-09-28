import type { Task } from "@/data/tasks.data";

/* ── Flow: ideaPipeline rendered as a single horizontal run ───────────── */

export function Flow({ steps }: { steps: string[] }) {
  return (
    <div className="task-flow flex flex-wrap md:flex-nowrap items-center gap-x-2.5 gap-y-2 md:overflow-x-auto md:overflow-y-hidden">
      <style>{`
        @media (max-width: 767px) {
          .task-flow {
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .task-flow .flow-pair { flex-direction: column; align-items: center; }
          .task-flow .flow-arrow-h { display: none; }
          .task-flow .flow-arrow-v { display: inline-block; }
        }
        @media (min-width: 768px) {
          .task-flow .flow-arrow-v { display: none; }
          .task-flow::-webkit-scrollbar { display: none; }
        }
      `}</style>
      {steps.map((step, i) => (
        <span key={i} className="flow-pair inline-flex items-center gap-2.5 shrink-0">
          <span
            className="mono px-2.5 py-1.5 border whitespace-nowrap"
            style={{
              borderColor: "var(--rule)",
              background: "var(--paper-raised)",
              color: "var(--ink-70)",
            }}
          >
            {step}
          </span>
          {i < steps.length - 1 && (
            <>
              <span className="flow-arrow-h mono" style={{ color: "var(--ink-15)" }}>→</span>
              <span className="flow-arrow-v mono" style={{ color: "var(--ink-15)", fontSize: "16px", lineHeight: 1 }}>↓</span>
            </>
          )}
        </span>
      ))}
    </div>
  );
}

/* ── Steps: label + detail pairs, hung off a hairline ─────────────────── */

export function Steps({
  items,
}: {
  items: { step?: string; phase?: string; detail: string }[];
}) {
  return (
    <ol
      className="border-l"
      style={{ borderColor: "var(--rule)", maxWidth: "var(--measure)" }}
    >
      {items.map((s, i) => (
        <li key={i} className="relative pl-6 pb-6 last:pb-0">
          <span
            className="absolute left-0 top-[9px] -translate-x-1/2 rounded-full"
            style={{
              width: 5,
              height: 5,
              background: "var(--paper)",
              border: "1px solid var(--ink-30)",
            }}
          />
          <p className="text-[14.5px]" style={{ color: "var(--ink)" }}>
            {s.step ?? s.phase}
          </p>
          <p
            className="mt-1 text-[14.5px] leading-[1.72]"
            style={{ color: "var(--ink-45)" }}
          >
            {s.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}

/* ── Endpoints: API surface as a ledger ───────────────────────────────── */

const METHOD_TONE: Record<string, string> = {
  GET: "var(--ink-45)",
  POST: "var(--accent)",
  PUT: "var(--accent)",
  PATCH: "var(--accent)",
  DELETE: "var(--accent)",
};

export function Endpoints({
  items,
}: {
  items: NonNullable<Task["apiChanges"]>;
}) {
  return (
    <div style={{ borderTop: "1px solid var(--rule)" }}>
      {items.map((api, i) => (
        <div
          key={i}
          className="py-3 grid grid-cols-[3.4rem_1fr] gap-x-4 items-baseline"
          style={{ borderBottom: "1px solid var(--rule-soft)" }}
        >
          <span
            className="mono"
            style={{ color: METHOD_TONE[api.method] ?? "var(--ink-45)" }}
          >
            {api.method}
          </span>
          <div className="min-w-0">
            <p className="mono break-all" style={{ color: "var(--ink)" }}>
              {api.path}
            </p>
            {api.note && (
              <p
                className="mt-1 text-[13.5px] leading-relaxed"
                style={{ color: "var(--ink-45)" }}
              >
                {api.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Verdicts: options weighed, one picked ────────────────────────────── */

export function Verdicts({
  items,
}: {
  items: NonNullable<Task["researchAnalysis"]>;
}) {
  return (
    <div className="space-y-5" style={{ maxWidth: "var(--measure)" }}>
      {items.map((r, i) => {
        const picked = r.verdict === "picked";
        return (
          <div
            key={i}
            className="pl-5 border-l"
            style={{
              borderColor: picked ? "var(--accent)" : "var(--rule)",
            }}
          >
            <div className="flex items-baseline gap-3">
              <p
                className="text-[14.5px]"
                style={{ color: picked ? "var(--ink)" : "var(--ink-45)" }}
              >
                {r.option}
              </p>
              <span
                className="label"
                style={{ color: picked ? "var(--accent)" : "var(--ink-15)" }}
              >
                {picked ? "chosen" : "passed"}
              </span>
            </div>
            <p
              className="mt-1.5 text-[14.5px] leading-[1.7]"
              style={{ color: "var(--ink-45)" }}
            >
              {r.reason}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Edges: named failure modes ───────────────────────────────────────── */

export function Edges({
  items,
}: {
  items: { title: string; note: string }[];
}) {
  return (
    <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
      {items.map((e, i) => (
        <div key={i}>
          <dt
            className="text-[14px] mb-1.5"
            style={{ color: "var(--ink)" }}
          >
            {e.title}
          </dt>
          <dd
            className="text-[14px] leading-[1.7]"
            style={{ color: "var(--ink-45)" }}
          >
            {e.note}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Schema: DDL plus a few real rows ─────────────────────────────────── */

export function SchemaTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth: 460 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="mono text-left font-normal py-2 pr-6 whitespace-nowrap"
                style={{
                  color: "var(--ink-30)",
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="mono py-2 pr-6 align-top"
                  style={{
                    color: "var(--ink-70)",
                    borderBottom: "1px solid var(--rule-soft)",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Pull quote: the one line worth remembering ───────────────────────── */

export function Pull({ children }: { children: React.ReactNode }) {
  return (
    <blockquote
      className="my-2 pl-6 border-l"
      style={{ borderColor: "var(--accent-line)", maxWidth: "58ch" }}
    >
      <p className="serif text-[19px] leading-[1.6]">{children}</p>
    </blockquote>
  );
}

/* ── Media: image or video, detected by extension ─────────────────────── */

const VIDEO = /\.(mp4|webm|mov|m4v|ogg)$/i;

export function Media({ src, alt, controls }: { src: string; alt: string; controls?: boolean }) {
  if (VIDEO.test(src)) {
    return (
      <video
        src={src}
        muted
        loop
        autoPlay
        playsInline
        controls={controls}
        className="w-full h-full object-contain"
        style={controls ? { background: "#000" } : undefined}
      />
    );
  }
  // Plain <img>: these are pre-sized local screenshots, and next/image adds
  // little here beyond a build-time cost on a 2 GB media folder.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />;
}
