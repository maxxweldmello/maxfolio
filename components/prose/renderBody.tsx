import type { WritingBlock } from "@/data/writings.data";
import Code from "@/components/Code";
import ZoomableSvg from "./ZoomableSvg";

/**
 * Writing bodies render as a single measured column. Everything except
 * diagrams and code stays inside `--measure` so line length never fights
 * the reader; plates break out slightly for breathing room.
 */

/** Turns `backticked` spans into inline code without pulling in a markdown parser. */
function inline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code
        key={i}
        style={{
          background: "var(--paper-sunken)",
          border: "1px solid var(--rule-soft)",
          padding: "0.08em 0.34em",
          borderRadius: 3,
          fontSize: "0.85em",
        }}
      >
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function renderWritingBody(body: WritingBlock[]): React.ReactNode[] {
  return body.map((block, i) => {
    switch (block.type) {
      case "heading":
        return block.level === 3 ? (
          <h3
            key={i}
            className="serif text-[19px] mt-12 mb-3"
            style={{ maxWidth: "var(--measure)" }}
          >
            {block.text}
          </h3>
        ) : (
          <h2 key={i} className="mt-16 mb-4" style={{ maxWidth: "var(--measure)" }}>
            <span className="block rule mb-5" />
            <span className="serif text-[25px] leading-snug block">
              {block.text}
            </span>
          </h2>
        );

      case "paragraph":
        return (
          <p
            key={i}
            className="text-[16px] leading-[1.82] my-5"
            style={{ color: "var(--ink-70)", maxWidth: "var(--measure)" }}
          >
            {inline(block.text)}
          </p>
        );

      case "list":
        return (
          <ul
            key={i}
            className="my-5 space-y-2.5"
            style={{ maxWidth: "var(--measure)" }}
          >
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3.5">
                <span
                  className="mono shrink-0 pt-[3px]"
                  style={{ color: "var(--ink-15)" }}
                >
                  {block.ordered
                    ? String(j + 1).padStart(2, "0")
                    : "—"}
                </span>
                <span
                  className="text-[15.5px] leading-[1.75]"
                  style={{ color: "var(--ink-70)" }}
                >
                  {inline(item)}
                </span>
              </li>
            ))}
          </ul>
        );

      case "code":
        return (
          <Code
            key={i}
            code={block.code}
            language={block.language}
            caption={block.caption}
          />
        );

      case "quote":
        return (
          <blockquote
            key={i}
            className="my-9 pl-6 border-l"
            style={{ borderColor: "var(--accent-line)", maxWidth: "var(--measure)" }}
          >
            <p className="serif text-[19px] leading-[1.6]">{block.text}</p>
          </blockquote>
        );

      case "callout":
        return (
          <aside
            key={i}
            className="my-8 p-5 border"
            style={{
              borderColor: "var(--rule)",
              background: "var(--paper-raised)",
              maxWidth: "var(--measure)",
            }}
          >
            {block.label && <p className="label mb-2.5">{block.label}</p>}
            <p
              className="text-[14.5px] leading-[1.75]"
              style={{ color: "var(--ink-70)" }}
            >
              {inline(block.text)}
            </p>
          </aside>
        );

      case "svg":
        return <ZoomableSvg key={i} svg={block.svg} caption={block.caption} />;

      default:
        return null;
    }
  });
}
