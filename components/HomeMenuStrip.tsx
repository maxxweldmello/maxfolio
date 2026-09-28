"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlobPill, HatchPill } from "@/components/HeroPills";
import { profileData } from "@/data/profile.data";

/**
 * Narrow 4th column — entire column is a menu trigger.
 * Only a centered → arrow; no text. Click slides in the full nav drawer.
 */
export default function HomeMenuStrip() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const [ctaColumnHeight, setCtaColumnHeight] = useState<number | null>(null);
  const router = useRouter();
  const hrefs = ["/career", "/work", "/learning"];

  useEffect(() => { setMounted(true); }, []);

  // Live-measure the home page's Resume/Contact column so the drawer's
  // footer row (mobile/tablet) can match its height exactly — CtaPlate uses
  // fluid clamp() sizing, so it changes continuously with viewport width
  // and a fixed breakpoint value can never track it precisely.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-cta-column]");
    if (!el) return;
    const update = () => setCtaColumnHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);


  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => Math.min(i + 1, hrefs.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter")     { setOpen(false); router.push(hrefs[active]); return; }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, active]);

  return (
    <>
      {/* ── trigger column ── */}
      <section
        data-tour="journey"
        className="order-5 lg:order-none lg:col-span-1 relative group cursor-pointer flex items-center justify-center overflow-hidden min-h-[64px] sm:min-h-[80px] lg:min-h-0 border-t border-l lg:border-t-0"
        style={{
          background: "rgba(0,0,0,0.42)",
          backdropFilter: "blur(20px) saturate(1.1)",
          borderTopColor: "rgba(255,255,255,0.14)",
          borderLeftColor: "rgba(255,255,255,0.14)",
        }}
        onClick={() => { setActive(0); setOpen(true); }}
        role="button"
        aria-label="Open menu"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
      >

        <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-24 lg:h-24">
          {/* revolving text */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full animate-spin group-hover:[animation-play-state:paused]"
            style={{ animationDuration: "10s", animationTimingFunction: "linear" }}
          >
            <defs>
              <path
                id="circle-path"
                d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
              />
            </defs>
            <text
              style={{
                fontSize: "10.5px",
                fill: "rgba(255,255,255,0.45)",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              <textPath href="#circle-path" textLength="232" lengthAdjust="spacing">
                · View my Journey · View my Journey
              </textPath>
            </text>
          </svg>
          {/* center arrow — fixed, does not spin */}
          <span
            className="relative z-10 text-[18px] transition-all duration-300 group-hover:scale-125"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            →
          </span>
        </div>
      </section>

      {/* ── full-screen drawer — portalled to body to escape backdrop-filter stacking context ── */}
      {mounted && createPortal(
        <div
          className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!open}
        >
          <div
            className="dark-surface absolute inset-0 flex flex-col lg:flex-row overflow-hidden transition-transform duration-500"
            style={{
              transform: open ? "translateX(0)" : "translateX(100%)",
              background: "rgba(8,8,8,0.55)",
              backdropFilter: "blur(24px) saturate(1.2)",
              color: "#fff",
              transitionTimingFunction: "cubic-bezier(0.7, 0, 0.2, 1)",
            }}
          >
            {/* left — full column: header + nav + footer */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col px-6 md:px-10">

              {/* ── top header ── */}
              <div className="flex items-center justify-between pt-5 pb-4 sm:pt-7 sm:pb-6 lg:border-b" style={{ borderBottomColor: "rgba(255,255,255,0.08)" }}>
                <Link
                  href="/"
                  aria-label="Home"
                  onClick={() => setOpen(false)}
                  className="tracking-[-0.03em] leading-none"
                  style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.3rem,1.8vw,1.7rem)", fontWeight: 700, fontVariationSettings: '"opsz" 144, "SOFT" 20', color: "rgba(255,255,255,0.9)", textDecoration: "none" }}
                >
                  {profileData.brand}
                </Link>
                <span
                  className="tracking-[0.22em] uppercase"
                  style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-sans)" }}
                >
                </span>
              </div>

              {/* ── nav rows —
                  mobile/tablet: same stacked positions as always, but each
                  link's word scrolls horizontally in an infinite marquee —
                  alternating direction per row, all slow. desktop: unchanged
                  static list. ── */}
              <nav data-tour="menu-links" className="flex-1 min-h-0 overflow-y-auto">
                <style>{`
                  @keyframes menu-marquee-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                  @keyframes menu-marquee-ltr { from { transform: translateX(-50%); } to { transform: translateX(0); } }
                `}</style>
                <ol className="h-full flex flex-col justify-evenly lg:justify-center lg:gap-0">
                  <MenuRow n="01" href="/career"   label="Career"   image="/nav/career-preview.png" pill={<BlobPill label="soft blob" />}     pillSide="after"  onNav={() => setOpen(false)} active={active === 0} onHover={() => setActive(0)} direction="rtl" duration={14} />
                  <MenuRow n="02" href="/work"     label="Work"     image="/nav/work-preview.png"   pill={<HatchPill label="hatched pill" />} pillSide="before" indent onNav={() => setOpen(false)} active={active === 1} onHover={() => setActive(1)} direction="ltr" duration={20} />
                  <MenuRow n="03" href="/learning" label="Learning" image="/nav/learning-preview.png"      pill={<BlobPill label="soft blob" />}     pillSide="after"  onNav={() => setOpen(false)} active={active === 2} onHover={() => setActive(2)} direction="rtl" duration={16} />
                </ol>
              </nav>

              {/* ── bottom footer —
                  mobile/tablet: same 3fr/2fr two-column split as the home
                  page's CTA-column + journey-button row, same row height —
                  NAVIGATE text in the left cell, close arrow centered in its
                  own right cell (not pinned to the edge). desktop: text only,
                  right-aligned — the close button lives in its own column. ── */}
              <div
                className="grid grid-cols-[3fr_2fr] lg:flex lg:justify-end items-center lg:min-h-0 lg:py-5 lg:!h-auto lg:border-t shrink-0"
                style={{
                  borderTopColor: "rgba(255,255,255,0.08)",
                  height: ctaColumnHeight ? `${ctaColumnHeight}px` : undefined,
                }}
              >
                <span className="inline-block -mt-4" style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-sans)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  ↑ ↓ · Navigate
                </span>

                {/* close — mobile/tablet only, same size/position language as
                    the home page's journey-trigger circle: centered in its
                    own column, same row height, same circle size. */}
                <div className="lg:hidden flex items-center justify-center h-full">
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="group flex items-center justify-center cursor-pointer w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-300 hover:scale-110 ml-4 -mt-4"
                    style={{ border: "1px solid rgba(255,255,255,0.35)" }}
                  >
                    <span className="text-[16px] sm:text-[18px]" style={{ color: "rgba(255,255,255,0.8)" }}>←</span>
                  </button>
                </div>
              </div>

            </div>

            {/* close — desktop only, unchanged right-side column */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="group hidden lg:flex shrink-0 w-[120px] items-center justify-center cursor-pointer lg:border-l"
              style={{ borderLeftColor: "rgba(255,255,255,0.14)" }}
            >
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group-hover:scale-110"
                style={{ border: "1px solid rgba(255,255,255,0.35)" }}
              >
                <span className="text-[16px]" style={{ color: "rgba(255,255,255,0.8)" }}>←</span>
              </div>
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function MenuRow({
  n, href, label, pill, pillSide, indent, external, onNav, active, onHover, direction, duration, image,
}: {
  n: string;
  href: string;
  label: string;
  pill: React.ReactNode;
  pillSide: "before" | "after";
  indent?: boolean;
  external?: boolean;
  onNav: () => void;
  active?: boolean;
  onHover?: () => void;
  /** mobile/tablet marquee direction — "rtl" scrolls right-to-left, "ltr" the opposite */
  direction: "ltr" | "rtl";
  /** mobile/tablet marquee loop duration in seconds — bigger = slower */
  duration: number;
  /** optional preview image filled INTO the label letters via background-clip: text */
  image?: string;
}) {
  const labelColor = active ? "#fff" : "rgba(255,255,255,0.35)";

  // When an image is supplied, the label's fill is the screenshot itself
  // (clipped to the letter shapes) instead of a flat color. Inactive rows
  // dim the image via opacity so the active row still reads as "lit up".
  const imageLabelStyle: React.CSSProperties | undefined = image
    ? {
        backgroundImage: `url("${image}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        filter: "grayscale(0.3) contrast(1.15) brightness(1.1)",
        opacity: active ? 1 : 0.4,
        transition: "opacity 0.2s",
      }
    : { color: labelColor, transition: "color 0.2s" };

  // Mobile/tablet: the word scrolls in an infinite marquee (label duplicated
  // once so translateX(-50%) loops seamlessly). Desktop: unchanged static text.
  const marqueeLabel = (
    <span className="lg:hidden relative flex-1 min-w-0 overflow-hidden">
      <span
        className="flex whitespace-nowrap w-max"
        style={{ animation: `menu-marquee-${direction} ${duration}s linear infinite` }}
      >
        <span className="display-heavy text-[clamp(3.2rem,20vw,9.5rem)] leading-none pr-10" style={imageLabelStyle}>
          {label}
        </span>
        <span aria-hidden className="display-heavy text-[clamp(3.2rem,20vw,9.5rem)] leading-none pr-10" style={imageLabelStyle}>
          {label}
        </span>
      </span>
    </span>
  );

  const staticLabel = (
    <span
      className="hidden lg:inline display-heavy text-[clamp(2.4rem,13vw,9.5rem)] leading-none min-w-0 truncate"
      style={imageLabelStyle}
    >
      {label}
    </span>
  );

  const content = (
    <span className={`flex items-center gap-2 sm:gap-3 lg:gap-4 md:gap-6 w-full min-w-0 ${indent ? "pl-3 sm:pl-6 md:pl-24" : ""}`}>
      <span
        className="text-[9px] sm:text-[11px] tracking-[0.22em] uppercase shrink-0 self-center"
        style={{ color: active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}
      >
        {n}
      </span>
      {pillSide === "before" && <span className="inline-block shrink-0">{pill}</span>}
      {marqueeLabel}
      {staticLabel}
      {pillSide === "after" && <span className="inline-block shrink-0">{pill}</span>}
    </span>
  );

  return (
    <li onMouseEnter={onHover}>
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNav}
          className="group block py-5 sm:py-6 md:py-5"
        >
          {content}
        </a>
      ) : (
        <Link
          href={href}
          onClick={onNav}
          data-tour={`menu-${label.toLowerCase()}`}
          className="group block py-5 sm:py-6 md:py-5"
        >
          {content}
        </Link>
      )}
    </li>
  );
}
