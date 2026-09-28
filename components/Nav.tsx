"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ThemeToggle from "@/components/ThemeToggle";

const LEFT_LINKS = [
  { href: "/career",  label: "Career" },
  { href: "/work",    label: "Work"     },
  { href: "/learning", label: "Learning" },
];
const RIGHT_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/resume",  label: "Resume"  },
];

// Bottom tab-bar routes (mobile/tablet only). Icons are inline SVGs so
// no icon-font dependency is required. `label` is shown only on the
// active tab (renders as a pill with icon + label), matching the
// reference bottom-nav pattern.
const TABS: {
  href: string;
  label: string;
  icon: (props: { size?: number }) => React.JSX.Element;
}[] = [
  {
    href: "/",
    label: "Home",
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 11L12 4L21 11V20a1 1 0 0 1-1 1h-5v-6h-4v6H4a1 1 0 0 1-1-1V11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/career",
    label: "Career",
    // documents stack — three offset paper sheets
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="7" y="3"  width="12" height="15" rx="1.5" fill="var(--paper)" stroke="currentColor" strokeWidth="1.5" />
        <rect x="5" y="5"  width="12" height="15" rx="1.5" fill="var(--paper)" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="7"  width="12" height="15" rx="1.5" fill="var(--paper)" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 12h6M6 15h6M6 18h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/work",
    label: "Work",
    // briefcase / bag
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 12h18" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/learning",
    label: "Learning",
    // open book — spread pages with centre spine
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 6v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 6c-2-1.6-4.5-2.2-8-2v14c3.5-.2 6 .4 8 2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M12 6c2-1.6 4.5-2.2 8-2v14c-3.5-.2-6 .4-8 2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "__more__",
    label: "More",
    icon: ({ size = 18 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

/* the pages that have a site tour, so the tab bar shows its "?" button there */
const TOUR_ROUTES = ["/career", "/work", "/learning", "/contact", "/resume"];

export default function Nav() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [mounted, setMounted] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-30 ${onHome ? "pointer-events-none" : ""}`}
      style={
        onHome
          ? { background: "transparent" }
          : {
              background: "color-mix(in srgb, var(--paper) 88%, transparent)",
              backdropFilter: "blur(10px)",
              borderBottom: "1px solid var(--rule-soft)",
            }
      }
    >
      <nav
        className="px-5 sm:px-6 md:px-10 h-[58px] flex lg:grid lg:grid-cols-3 items-center justify-between"
        style={{ color: onHome ? "#fff" : "var(--ink)" }}
      >
        {/* left — desktop link row */}
        <div className="hidden lg:flex items-center gap-7">
          {!onHome &&
            LEFT_LINKS.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[13.5px]"
                  style={{ color: active ? "var(--ink)" : "var(--ink-45)" }}
                >
                  {l.label}
                </Link>
              );
            })}
        </div>

        {/* center — logo, centered on every breakpoint */}
        <div className="flex-1 flex justify-center lg:flex-none">
          {!onHome && (
            <Link
              href="/"
              className="tracking-[-0.03em] leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.5rem, 2vw, 1.9rem)",
                fontWeight: 700,
                fontVariationSettings: '"opsz" 144, "SOFT" 20',
                color: "inherit",
              }}
            >
              Maxfolio.
            </Link>
          )}
        </div>

        {/* right — desktop link row */}
        <div className="flex items-center justify-end gap-7">
          {!onHome && (
            <div className="hidden lg:flex items-center gap-7">
              {RIGHT_LINKS.map((l) => {
                const active = pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-[13.5px]"
                    style={{ color: active ? "var(--ink)" : "var(--ink-45)" }}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <ThemeToggle />
            </div>
          )}
        </div>
      </nav>

      {/* mobile/tablet bottom tab bar — portalled to <body> so no
          ancestor's transform/backdrop-filter breaks its fixed
          positioning. Fixed at the bottom of the viewport at all times,
          rendered on every route including home (hidden on desktop). */}
      {!onHome && mounted && createPortal(
        <>
          <div
            className="lg:hidden fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full"
            style={{
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
              background: "var(--paper)",
              border: "1px solid var(--rule-soft)",
              color: "var(--ink)",
              maxWidth: "calc(100vw - 24px)",
            }}
          >
            {TABS.map((t) => {
              const isMore = t.href === "__more__";
              // "More" tab counts as active when the current route is
              // one of the overflow links (Contact / Resume), so the
              // active-pill label reflects where the user actually is.
              const moreActive = isMore && RIGHT_LINKS.some((l) => pathname.startsWith(l.href));
              // Task detail pages (`/tasks/...`) belong to Work — treat
              // them as an active-Work route so the tab bar reflects the
              // section the user is actually browsing.
              const workOwnsTasks = t.href === "/work" && pathname.startsWith("/tasks");
              const active = isMore
                ? moreActive
                : t.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(t.href) || workOwnsTasks;
              const Icon = t.icon;

              const activeLabel = moreActive
                ? RIGHT_LINKS.find((l) => pathname.startsWith(l.href))!.label
                : t.label;

              const common = (
                <span
                  className="flex items-center gap-1.5 rounded-full transition-colors"
                  style={{
                    padding: active ? "8px 14px" : "8px",
                    background: active ? "var(--rule-soft)" : "transparent",
                    color: active ? "var(--ink)" : "var(--ink-45)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  <Icon size={18} />
                  {active && <span>{activeLabel}</span>}
                </span>
              );

              if (isMore) {
                return (
                  <button
                    key={t.href}
                    onClick={() => setMoreOpen((v) => !v)}
                    aria-label="More"
                    aria-expanded={moreOpen}
                    className="flex items-center"
                    style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                  >
                    {common}
                  </button>
                );
              }

              return (
                <Link key={t.href} href={t.href} className="flex items-center">
                  {common}
                </Link>
              );
            })}
            <ThemeToggle className="ml-0.5" />
            {/* the site tour's button: last in the bar, black, on the pages that have a tour */}
            {TOUR_ROUTES.includes(pathname) && (
              <button
                type="button"
                aria-label="Start the site tour"
                title="Site tour"
                onClick={() => window.dispatchEvent(new Event("site-tour:start"))}
                className="flex items-center justify-center rounded-full"
                style={{ width: 34, height: 34, marginLeft: 2, background: "#000", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 15, lineHeight: 1 }}
              >
                ?
              </button>
            )}
          </div>

          {/* small overflow menu triggered by the "More" tab — shows
              Contact + Resume (the two routes that don't fit as primary
              tabs). Fades in above the tab bar, tap outside to close. */}
          {moreOpen && (
            <div
              className="lg:hidden fixed inset-0 z-40"
              onClick={() => setMoreOpen(false)}
              style={{ background: "rgba(0,0,0,0.35)" }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute rounded-2xl overflow-hidden"
                style={{
                  right: "20px",
                  bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",
                  background: "var(--paper)",
                  border: "1px solid var(--rule-soft)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
                  minWidth: 200,
                }}
              >
                {RIGHT_LINKS.map((l, i) => {
                  const active = pathname.startsWith(l.href);
                  // envelope for Contact, sheet-of-paper for Resume
                  const Icon = l.href === "/contact"
                    ? () => (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                        </svg>
                      )
                    : () => (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                          <path d="M15 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                          <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      );
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex items-center justify-between px-5 py-4"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 16,
                        fontWeight: active ? 600 : 400,
                        color: active ? "var(--ink)" : "var(--ink-70)",
                        background: active ? "var(--rule-soft)" : "transparent",
                        borderTop: i > 0 ? "1px solid var(--rule-soft)" : "none",
                        textDecoration: "none",
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <Icon />
                        {l.label}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: active ? 1 : 0.35 }}>
                        <path d="M5 3L11 8L5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </header>
  );
}
