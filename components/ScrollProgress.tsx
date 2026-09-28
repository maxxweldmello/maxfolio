"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const onHome = pathname === "/";

  useEffect(() => {
    setProgress(0);

    const update = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? scrolled / total : 0);
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);

  if (onHome) return null;

  return (
    <div
      className="fixed top-[57px] inset-x-0 z-40 h-[2px]"
      style={{ background: "var(--rule-soft)" }}
    >
      <div
        className="h-full transition-none"
        style={{
          width: `${progress * 100}%`,
          background: "var(--ink)",
        }}
      />
    </div>
  );
}
