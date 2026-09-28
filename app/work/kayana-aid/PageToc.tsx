"use client";

import { useEffect, useState } from "react";

type TocItem = { id: string; num: string; label: string };

export function MobileToc({ items }: { items: TocItem[] }) {
  return (
    <nav
      aria-label="Contents"
      className="flex gap-2 overflow-x-auto lg:justify-center"
      style={{
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
        marginLeft: -12,
        marginRight: -12,
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      <style>{`nav[aria-label="Contents"]::-webkit-scrollbar { display: none; }`}</style>
      {items.map((t) => (
        <a
          key={t.id}
          href={`#${t.id}`}
          className="mono px-3 py-1.5 shrink-0"
          style={{
            fontSize: "10.5px",
            color: "var(--ink-45)",
            border: "1px solid var(--rule)",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: "var(--accent)" }}>{t.num}</span> {t.label}
        </a>
      ))}
    </nav>
  );
}

export default function PageToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const nodes = items
      .map((it) => document.getElementById(it.id))
      .filter((n): n is HTMLElement => !!n);

    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [items]);

  const activeIndex = Math.max(0, items.findIndex((t) => t.id === activeId));
  const progress = items.length > 1 ? activeIndex / (items.length - 1) : 0;

  return (
    <nav aria-label="Contents" className="relative">
      <div
        aria-hidden
        style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 1, background: "var(--rule)" }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute", left: 0, top: 4, width: 1,
          height: `calc((100% - 8px) * ${progress})`,
          background: "var(--accent)",
          transition: "height 200ms ease",
        }}
      />
      <ol className="space-y-5 pl-4">
        {items.map((t) => {
          const active = t.id === activeId;
          return (
            <li key={t.id}>
              <a href={`#${t.id}`} className="block group">
                <span
                  className="mono block"
                  style={{ fontSize: "10px", color: active ? "var(--accent)" : "var(--ink-15)", transition: "color 150ms ease" }}
                >
                  {t.num}
                </span>
                <span
                  className="mono block mt-0.5"
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.02em",
                    lineHeight: 1.3,
                    color: active ? "var(--ink)" : "var(--ink-45)",
                    transition: "color 150ms ease",
                  }}
                >
                  {t.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
