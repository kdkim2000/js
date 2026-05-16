const GRADIENTS: Record<string, string> = {
  purple: 'linear-gradient(135deg,#9B8AFB,#6941C6)',
  blue:   'linear-gradient(135deg,#53B1FD,#1570EF)',
  green:  'linear-gradient(135deg,#32D583,#027A48)',
  orange: 'linear-gradient(135deg,#FDB022,#B54708)',
  rose:   'linear-gradient(135deg,#F97066,#B42318)',
  teal:   'linear-gradient(135deg,#2ED3B7,#0E9384)',
};

const TINTS = Object.keys(GRADIENTS);

export function getSiteTint(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return TINTS[h % TINTS.length];
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface Props {
  name: string;
  id: string;
  size?: number;
  radius?: number;
  fontSize?: number;
}

export default function SiteGlyph({ name, id, size = 40, radius = 10, fontSize = 13 }: Props) {
  const tint = getSiteTint(id);
  const gradient = GRADIENTS[tint] ?? GRADIENTS.purple;

  return (
    <span
      className="inline-flex items-center justify-center shrink-0 text-white font-bold select-none"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: gradient,
        fontSize,
        lineHeight: 1,
        fontFamily: 'var(--font-display)',
      }}
    >
      {initials(name)}
    </span>
  );
}
