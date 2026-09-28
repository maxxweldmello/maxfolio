/** Shared page opening — an eyebrow, a serif line, and a short standfirst. */
export default function PageHeader({
  eyebrow,
  title,
  standfirst,
  aside,
  className = "",
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  standfirst?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={`mb-12 md:mb-16 ${className}`}>
      <p className="label mb-5">{eyebrow}</p>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <h1 className="display text-[clamp(2.1rem,5.4vw,3.6rem)] max-w-[19ch]">
          {title}
        </h1>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>

      {standfirst && (
        <p
          className="mt-6 text-[15px] md:text-[16px] leading-[1.72]"
          style={{ color: "var(--ink-70)" }}
        >
          {standfirst}
        </p>
      )}
    </header>
  );
}
