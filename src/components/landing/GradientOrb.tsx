interface GradientOrbProps {
  seed: string;
  size?: number;
  className?: string;
}

// Deterministic hash → 0..1
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Editorial palette pairs — warm/cool brand-adjacent tones
const palettes: Array<[string, string, string]> = [
  ["#1F2937", "#4F46E5", "#A5B4FC"], // ink → indigo
  ["#0A0F1C", "#475569", "#E2E8F0"], // graphite → fog
  ["#3F3F46", "#7C3AED", "#DDD6FE"], // slate → violet
  ["#1E293B", "#0EA5E9", "#BAE6FD"], // navy → sky
  ["#27272A", "#F59E0B", "#FDE68A"], // ink → amber (warm)
  ["#0F172A", "#10B981", "#A7F3D0"], // navy → emerald
];

export function GradientOrb({ seed, size = 40, className = "" }: GradientOrbProps) {
  const h = hash(seed);
  const palette = palettes[h % palettes.length];
  const angle = (h * 37) % 360;
  const id = `orb-${h.toString(36)}`;
  const blobX = 30 + ((h >> 3) % 40);
  const blobY = 30 + ((h >> 5) % 40);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`shrink-0 rounded-full ${className}`}
      style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18), 0 4px 10px -4px rgba(15,23,42,0.25)" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform={`rotate(${angle} 0.5 0.5)`}>
          <stop offset="0%" stopColor={palette[0]} />
          <stop offset="55%" stopColor={palette[1]} />
          <stop offset="100%" stopColor={palette[2]} />
        </linearGradient>
        <radialGradient id={`${id}-blob`} cx={`${blobX}%`} cy={`${blobY}%`} r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-shine`} cx="30%" cy="25%" r="40%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill={`url(#${id}-bg)`} />
      <circle cx="20" cy="20" r="20" fill={`url(#${id}-blob)`} />
      <circle cx="20" cy="20" r="20" fill={`url(#${id}-shine)`} />
    </svg>
  );
}
