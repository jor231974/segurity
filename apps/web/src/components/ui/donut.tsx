interface DonutProps {
  /** Valor actual (parte llena) */
  value: number;
  /** Valor total de referencia */
  total: number;
  /** Tamaño del anillo en px */
  size?: number;
  /** Grosor del anillo en px */
  strokeWidth?: number;
  /** Color de la porción llena */
  color?: string;
  /** Color del fondo del anillo */
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

export function Donut({ value, total, size = 120, strokeWidth = 14, color = '#3558c9', trackColor = '#e2e8f0', label, sublabel }: DonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-xl font-bold text-slate-900">{label}</span>}
        {sublabel && <span className="text-[11px] text-slate-500">{sublabel}</span>}
      </div>
    </div>
  );
}