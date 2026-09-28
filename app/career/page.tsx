import type { Metadata } from "next";
import CareerHero from "@/components/career/CareerHero";
import TreeView from "@/components/work/TreeView";
import { getCompanies } from "@/lib/data";
import Tour from "@/components/tour/Tour";
import { siteTour } from "@/components/tour/flow";

export const metadata: Metadata = {
  title: "Career",
  description: "Every company, project, and task — the complete record.",
};

export default async function CareerPage() {
  const companies = await getCompanies();

  return (
    <main style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <CareerHero />
      <div style={{ height: 1, background: "var(--rule)" }} />
      <div data-tour="timeline">
        <TreeView companies={companies} />
      </div>
      <Tour steps={siteTour} autoStartDelay={null} fabTone="dark" fabInNav />
    </main>
  );
}
