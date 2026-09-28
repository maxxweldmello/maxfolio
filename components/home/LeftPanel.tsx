import Link from "next/link";

interface LeftPanelProps {
  brand: string;
  headline: { main: string; italic: string };
  bio: string;
  roleTitle: string;
  footerCaption: string;
  year: number;
}

/**
 * Two independent grid rows (kept as one component so the call site in
 * page.tsx stays simple):
 *   1. Brand/logo — row 1 on mobile/tablet; absolutely pinned top-left on
 *      desktop (unchanged from the original single-section layout).
 *   2. Headline + bio — row 3 on mobile/tablet (after the portrait), the
 *      original 5-col left column on desktop.
 * Returning a Fragment means both become real siblings of MiddlePanel /
 * RightPanel / HomeMenuStrip inside the same CSS grid, so `order` can place
 * the logo before the image and the headline after it on small screens.
 */
export default function LeftPanel({
  brand,
  headline,
  bio,
}: LeftPanelProps) {
  return (
    <>
      {/* ── 1. brand / logo ──
          Mobile/tablet: its own compact row with the panel's translucent bg.
          Desktop: pinned top-left, transparent — original design had no bg of
          its own here, it sat on top of the headline section's blur below it. */}
      <section
        className="relative col-span-2 order-1 lg:order-none lg:absolute lg:top-0 lg:left-0 lg:z-30 lg:h-[58px] lg:w-auto flex items-center h-11 sm:h-14 px-6 sm:px-8 lg:px-10 bg-[rgba(0,0,0,0.42)] lg:bg-transparent"
      >
        <Link
          href="/"
          aria-label="Home"
          className="tracking-[-0.03em] leading-none"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.15rem, 4vw, 1.9rem)",
            fontWeight: 700,
            fontVariationSettings: '"opsz" 144, "SOFT" 20',
            color: "#fff",
            textDecoration: "none",
          }}
        >
          {brand}
        </Link>
      </section>

      {/* ── 2. headline + bio ── */}
      <section
        data-tour="home-left"
        className="relative col-span-2 order-3 lg:order-none lg:col-span-5 flex flex-col justify-center min-h-0 px-6 py-2 sm:px-8 sm:py-3 lg:p-10 lg:pt-[72px] border-b lg:border-b-0"
        style={{
          background: "rgba(0,0,0,0.42)",
          backdropFilter: "blur(20px) saturate(1.1)",
          borderRight: "1px solid rgba(255,255,255,0.10)",
          borderBottomColor: "rgba(255,255,255,0.14)",
        }}
      >
        <div className="flex flex-col gap-1.5 sm:gap-3 lg:gap-6 lg:flex-1 lg:justify-center lg:py-8 min-h-0">
          <h1
            className="tracking-[-0.028em] leading-[1.04] lg:leading-[0.98] text-[clamp(1.7rem,7.2vw,2.9rem)] lg:text-[clamp(1.8rem,3vw,2.9rem)]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontVariationSettings: '"opsz" 144, "SOFT" 30',
            }}
          >
            {headline.main}<br />
            <span style={{ fontStyle: "normal", color: "rgba(255,255,255,0.72)" }}>
              {headline.italic}
            </span>
          </h1>

          <p
            className="text-left leading-[1.45] sm:leading-[1.6] lg:leading-[1.72] text-[clamp(13px,3.4vw,15px)] lg:text-[13px]"
            style={{
              color: "rgba(255,255,255,0.62)",
            }}
          >
            {bio}
          </p>
        </div>
      </section>
    </>
  );
}
