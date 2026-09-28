import PageHeader from "@/components/PageHeader";
import WorkStats from "./WorkStats";
import type { SiteSettings, WorkCompany } from "@/lib/types";

interface Props {
  workPage: SiteSettings["workPage"];
  companies: WorkCompany[];
}

export default function WorkHeader({ workPage, companies }: Props) {
  const companyCount = companies.length;
  const projectCount = companies.reduce((n, c) => n + c.projects.length, 0);

  const stats = [
    { value: workPage.experienceStat,   label: "Experience" },
    { value: String(companyCount),       label: "Companies"  },
    { value: String(projectCount),       label: "Projects"   },
  ];

  return (
    <>
    <style>{`@media (max-width: 767px) { .work-head h1 { font-size: clamp(2.6rem, 12vw, 3.4rem); line-height: 1.02; max-width: none; } .work-head > p:last-of-type { font-size: 16px; } }`}</style>
    <PageHeader
      className="work-head"
      eyebrow={
        <>
          <span style={{ display: "inline-block", width: "1.8em", height: "1px", background: "var(--ink-45)", verticalAlign: "middle", marginRight: "0.5em", marginBottom: "1px" }} />
          {workPage.eyebrow}
        </>
      }
      title={
        <>
          {workPage.titleLines[0]}
          <br />
          {workPage.titleLines[1]}
        </>
      }
      standfirst={workPage.standfirst}
      aside={<WorkStats stats={stats} />}
    />
    </>
  );
}
