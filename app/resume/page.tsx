import type { Metadata } from "next";
import ResumeHero from "@/components/resume/ResumeHero";
import { getResumePage } from "@/lib/data";
import Tour from "@/components/tour/Tour";
import { siteTour } from "@/components/tour/flow";

export const metadata: Metadata = {
  title: "Résumé",
  description: "Résumé of Maxwel D'Mello — software engineer.",
};

export default async function ResumePage() {
  const resumeData = await getResumePage();
  const pdfUrl = resumeData.pdfUrl;
  const downloadUrl = resumeData.downloadUrl || pdfUrl;

  return (
    <main
      className="min-h-screen pt-[58px] flex flex-col resume-page"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <style>{`
        @media (max-width: 1023px) {
          .resume-pdf-section { padding: 20px 16px 110px !important; }
          .resume-pdf-frame { border-radius: 8px !important; }
        }
        @media (max-width: 640px) {
          .resume-pdf-section { padding: 16px 12px 110px !important; }
        }
      `}</style>
      <ResumeHero pdfUrl={pdfUrl} downloadUrl={downloadUrl} />

      {/* PDF viewer */}
      <section className="flex-1 px-6 md:px-16 lg:px-24 py-10 resume-pdf-section">
        <div className="max-w-[1180px] mx-auto w-full">
          <div
            className="w-full rounded-[12px] overflow-hidden resume-pdf-frame"
            style={{
              border: "1px solid var(--rule)",
              aspectRatio: "1 / 1.4142",
            }}
          >
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
              title="Maxwel D'Mello — Résumé"
              className="w-full h-full"
              style={{ border: "none" }}
            />
          </div>
        </div>
      </section>
      <Tour steps={siteTour} autoStartDelay={null} fabTone="dark" fabInNav />
    </main>
  );
}
