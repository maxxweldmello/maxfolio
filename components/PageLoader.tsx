"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState(false);
  const [hidden, setHidden]     = useState(false);

  useEffect(() => {
    setProgress(0);
    setDone(false);
    setHidden(false);

    const start = Date.now();
    let p = 0;

    const tick = setInterval(() => {
      p += Math.random() * 12 + 3;
      if (p >= 85) { p = 85; clearInterval(tick); }
      setProgress(p);
    }, 80);

    const finish = () => {
      clearInterval(tick);
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 1000 - elapsed);
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => setDone(true), 300);
        setTimeout(() => setHidden(true), 700);
      }, remaining);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    return () => {
      clearInterval(tick);
      window.removeEventListener("load", finish);
    };
  }, [pathname]);

  if (hidden) return null;

  return (
    <div
      data-page-loader
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--paper)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: done ? 0 : 1,
        transition: "opacity 0.4s ease",
        pointerEvents: done ? "none" : "auto",
      }}
    >
      <div style={{ position: "relative", userSelect: "none" }}>
        {/* Base text — light fill */}
        <span
          aria-hidden
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--rule)",
            display: "block",
            lineHeight: 1,
          }}
        >
          Maxfolio.
        </span>

        {/* Fill text — clips from bottom to top based on progress */}
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            display: "block",
            lineHeight: 1,
            position: "absolute",
            inset: 0,
            clipPath: `inset(${100 - progress}% 0 0 0)`,
            transition: "clip-path 0.12s ease-out",
          }}
        >
          Maxfolio.
        </span>
      </div>
    </div>
  );
}
