"use client";

import { useEffect, useState } from "react";
import ExploreView from "./ExploreView";
import ExploreMobile from "./ExploreMobile";
import type { WorkCompany } from "@/lib/types";

/* Wide screens get the desktop gallery, phones and small tablets their own draggable version. Nothing shows until the screen
   size is known, so the wrong one never flashes up. */
export default function WorkViews({ companies }: { companies: WorkCompany[] }) {
  const [narrow, setNarrow] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (narrow === null) return <div style={{ height: 560 }} aria-hidden />;
  return narrow ? <ExploreMobile companies={companies} /> : <ExploreView companies={companies} />;
}
