interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export default function KpiCard({ label, value, sub, accent }: Props) {
  return (
    <div className="flex flex-col gap-1 px-6 py-5">
      <span className="text-[11px] font-medium uppercase tracking-[.06em] text-gray-500 font-mono">
        {label}
      </span>
      <span
        className={`text-[32px] font-bold leading-[38px] tracking-tight ${accent ? 'text-purple-700' : 'text-gray-900'}`}
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '-.02em' }}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}
