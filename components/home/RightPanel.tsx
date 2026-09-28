import React from "react";
import CtaPlate, { type CtaPlateProps } from "./CtaPlate";

interface RightPanelProps {
  ctas: CtaPlateProps[];
}

/** Right column — stacked CTA plates driven by data. */
export default function RightPanel({ ctas }: RightPanelProps) {
  return (
    <section
      data-cta-column
      className="order-4 lg:order-none lg:col-span-2 flex flex-col relative shrink-0 px-6 sm:px-8 lg:px-0 border-t lg:border-t-0"
      style={{
        background: "rgba(0,0,0,0.42)",
        backdropFilter: "blur(20px) saturate(1.1)",
        borderRight: "1px solid rgba(255,255,255,0.10)",
        borderTopColor: "rgba(255,255,255,0.14)",
      }}
    >
      {ctas.map((cta, i) => (
        <React.Fragment key={cta.href}>
          {i > 0 && (
            <div
              aria-hidden
              className="h-px shrink-0 -mx-6 sm:-mx-8 lg:mx-0"
              style={{ background: "rgba(255,255,255,0.10)" }}
            />
          )}
          <CtaPlate {...cta} />
        </React.Fragment>
      ))}
    </section>
  );
}
