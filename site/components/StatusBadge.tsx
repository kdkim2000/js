type Status = 'pending' | 'running' | 'done' | 'error';

const STYLES: Record<Status, { bg: string; text: string; label: string; dot?: boolean }> = {
  done:    { bg: 'bg-green-50',  text: 'text-green-700',  label: '완료' },
  running: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: '크롤 중', dot: true },
  pending: { bg: 'bg-gray-100',  text: 'text-gray-700',   label: '대기' },
  error:   { bg: 'bg-red-50',    text: 'text-red-700',    label: '오류' },
};

export default function StatusBadge({ status }: { status: Status }) {
  const s = STYLES[status] ?? STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-[14px] ${s.bg} ${s.text}`}>
      {s.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-current"
          style={{ animation: 'pulse-dot 1.4s ease-in-out infinite' }}
        />
      )}
      {s.label}
    </span>
  );
}
