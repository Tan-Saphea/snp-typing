export default function ProgressBar({ value = 0, label = "Progress", color = "bg-primary-600" }) {
  const safeValue = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-600">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full border-2 border-slate-900 bg-white shadow-[0_2px_0_0_#cbd5e1]" aria-label={`${label}: ${safeValue}%`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeValue}>
        <div className={`h-full transition-all duration-500 ${color}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
