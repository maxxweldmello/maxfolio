/**
 * Every section of a case note opens the same way: an index, a rule, a serif
 * title. The repetition is the point — it makes a long page scannable without
 * a heavy chrome of cards and boxes.
 */
export default function Section({
  index,
  title,
  id,
  children,
}: {
  index: number;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 pt-14 first:pt-0 task-section">
      <div className="flex items-baseline gap-4 mb-6 task-section-head">
        <span className="mono shrink-0" style={{ color: "var(--ink-15)" }}>
          {String(index).padStart(2, "0")}
        </span>
        <h2 className="serif text-[21px] shrink-0">{title}</h2>
        <span className="flex-1 rule-soft" />
      </div>
      <div className="pl-0 md:pl-10">{children}</div>
    </section>
  );
}

/** Body copy at the reading measure — the default voice of a section. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[15.5px] leading-[1.8]"
      style={{ color: "var(--ink-70)", maxWidth: "var(--measure)" }}
    >
      {children}
    </p>
  );
}

/** Dashed list — used wherever the source data is a flat string[]. */
export function Points({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3" style={{ maxWidth: "var(--measure)" }}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            className="mono shrink-0"
            aria-hidden
            style={{ color: "var(--ink-45)", marginTop: 3 }}
          >
            →
          </span>
          <span
            className="text-[15px] leading-[1.75]"
            style={{ color: "var(--ink-70)" }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
