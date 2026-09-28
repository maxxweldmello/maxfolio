const MONO: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 7,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "rgba(255,255,255,0.3)",
};

interface MiddlePanelProps {
  heroImage: string;
  name: string;
}

export default function MiddlePanel({ heroImage }: MiddlePanelProps) {
  return (
    <section
      data-tour="home-middle"
      className="col-span-2 order-2 lg:order-none lg:col-span-4 relative h-full min-h-[56px] lg:min-h-0"
      style={{
        background: "rgba(0,0,0,0.05)",
        borderRight: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      {/* Image — higher contrast treatment */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[center_18%] lg:bg-[center_22%]"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          filter: "grayscale(1) contrast(1.2) brightness(0.75)",
        }}
      />

      {/* Scan lines */}
      <div aria-hidden className="absolute inset-0" style={{
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 3px)",
        pointerEvents: "none",
      }} />

      {/* Halftone dots */}
      <div aria-hidden className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "8px 8px",
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }} />

      {/* Bottom fade */}
      <div aria-hidden className="absolute inset-0" style={{
        background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)",
      }} />
    </section>
  );
}
