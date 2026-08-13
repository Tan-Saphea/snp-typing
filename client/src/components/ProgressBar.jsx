export default function ProgressBar({ value = 0, label = "Progress", color = "bg-primary-600" }) {
  const safeValue = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-600">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" aria-label={`${label}: ${safeValue}%`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeValue}>
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
