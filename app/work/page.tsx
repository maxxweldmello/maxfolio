import type { Metadata } from "next";
import WorkHeader from "@/components/work/WorkHeader";
import WorkViews from "@/components/work/WorkViews";
import { getSiteSettings, getCompanies } from "@/lib/data";
import Tour from "@/components/tour/Tour";
import { siteTour } from "@/components/tour/flow";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Every company, every system, every task shipped to production — the complete record.",
};

export default async function WorkPage() {
  const [settings, companies] = await Promise.all([
    getSiteSettings(),
    getCompanies(),
  ]);

  return (
    <main className="min-h-screen" style={{ overflowX: "clip" }}>
      <div className="mx-auto max-w-[1180px] px-6 md:px-10 pt-32 md:pt-40 pb-28">
        <WorkHeader workPage={settings.workPage} companies={companies} />
        <WorkViews companies={companies} />
      </div>
      <Tour steps={siteTour} autoStartDelay={null} fabTone="dark" fabInNav />
    </main>
  );
}
