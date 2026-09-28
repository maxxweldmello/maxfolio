/** Hairline icon set — 1px strokes, no fills, sized in em so they sit on the baseline. */

type P = { size?: number; className?: string; style?: React.CSSProperties };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function ArrowRight({ size = 13, className, style }: P) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function ArrowLeft({ size = 13, className, style }: P) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M13 8H3M7 4L3 8l4 4" />
    </svg>
  );
}

export function ArrowUpRight({ size = 13, className, style }: P) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M5 11L11 5M6 5h5v5" />
    </svg>
  );
}

export function Copy({ size = 13, className, style }: P) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5v-1a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1" />
    </svg>
  );
}

export function Check({ size = 13, className, style }: P) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M3 8.5l3.5 3.5L13 5" />
    </svg>
  );
}

export function ChevronLeft({ size = 13, className, style }: P) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M10 3L5 8l5 5" />
    </svg>
  );
}

export function ChevronRight({ size = 13, className, style }: P) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

export function X({ size = 13, className, style }: P) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

export function Expand({ size = 13, className, style }: P) {
  return (
    <svg {...base(size)} className={className} style={style}>
      <path d="M10 3h3v3M13 3l-5 5M6 13H3v-3M3 13l5-5" />
    </svg>
  );
}
