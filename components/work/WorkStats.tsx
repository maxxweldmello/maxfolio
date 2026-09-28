interface StatItem {
  value: string;
  label: string;
}

export default function WorkStats({ stats }: { stats: StatItem[] }) {
  return (
    <dl className="flex gap-8">
      {stats.map(({ value, label }) => (
        <div key={label}>
          <dd className="serif text-[26px] leading-none">{value}</dd>
          <dt className="label mt-2">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
