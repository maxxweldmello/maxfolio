"use client";

import { useEffect } from "react";

/**
 * The site's global PageLoader keeps a full-screen overlay up until
 * `window.load` plus ~1.7s, so any scroll caused by late-loading content
 * (images, the ReactFlow canvases) during that window is invisible until
 * the loader fades — by then a plain mount-time scrollTo(0,0) has already
 * been overridden. Reassert top-of-page at several points to outlast it.
 */
export default function ResetScroll() {
  useEffect(() => {
    if (window.location.hash) return;

    const toTop = () => window.scrollTo(0, 0);

    toTop();
    const t1 = setTimeout(toTop, 300);
    const t2 = setTimeout(toTop, 900);
    const t3 = setTimeout(toTop, 1800);
    window.addEventListener("load", toTop);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("load", toTop);
    };
  }, []);

  return null;
}
