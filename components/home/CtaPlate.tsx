import Link from "next/link";

export interface CtaPlateProps {
  label: string;
  caption: string;
  href: string;
  external?: boolean;
}

/** A single full-height CTA plate used in the right panel. */
export default function CtaPlate({ label, caption, href, external }: CtaPlateProps) {
  const inner = (
    <div className="flex flex-col justify-between h-full gap-1 lg:gap-0">
      <span
        className="tracking-[0.22em] uppercase"
        style={{ color: "rgba(255,255,255,0.55)", fontSize: "clamp(7px, 1.8vw, 10px)" }}
      >
        {caption}
      </span>
      <div className="flex items-end justify-between">
        <span
          className="tracking-[-0.02em] leading-none"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1rem, 4.2vw, 2.2rem)",
            fontWeight: 500,
          }}
        >
          {label} ↗
        </span>
      </div>
    </div>
  );

  const base =
    "flex-1 min-h-[52px] sm:min-h-[64px] lg:min-h-0 group py-3 sm:py-4 lg:p-8 cursor-pointer transition-colors";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={base} style={{ minHeight: 0 }}>
        {inner}
      </a>
    );
  }
  return (
    <a href={href} className={base} style={{ minHeight: 0 }}>
      {inner}
    </a>
  );
}
