"use client";

import { useTheme } from "@/components/ThemeProvider";

/** Swaps the contact page's decorative portrait by theme — the white-background
 * illustration reads on the light theme, the original photo on dark. */
export default function ContactHeroImage({ className }: { className?: string }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? "/contact/portrait-dark.png" : "/contact/portrait-light.png";

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={className}
      style={{
        // desktop: positioned from the shared wrapper that also holds the
        // heading's own "padding-top: clamp(28px, 6vh, 72px)" — add that
        // back in so this lands at the same spot it did before the image
        // moved out to a shared ancestor (for the mobile reorder below it).
        position: "absolute", top: "calc(clamp(28px, 6vh, 72px) - 20px)", right: "-24px",
        width: "clamp(220px, 36vw, 440px)",
        height: "clamp(170px, 28vw, 340px)",
        objectFit: "contain",
        pointerEvents: "none", zIndex: 0,
      }}
    />
  );
}
