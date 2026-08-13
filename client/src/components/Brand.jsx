export default function Brand({ compact = false, inverse = false }) {
  return (
    <div className="flex items-center gap-3" aria-label="SNP Typing">
      <span className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 p-1 shadow-[0_3px_0_0_rgba(15,23,42,0.35)] ${inverse ? "border-white/30 bg-white" : "border-slate-900 bg-white"}`}>
        <img src="/logo.png" alt="SNP School Logo" className="h-full w-full object-contain" />
      </span>
      {!compact && (
        <div>
          <p className={`text-lg font-black leading-none tracking-tight ${inverse ? "text-white" : "text-ink"}`}>SNP Typing</p>
          <p className={`mt-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] ${inverse ? "text-slate-400" : "text-slate-500"}`}>
            Learning workspace
          </p>
        </div>
      )}
    </div>
  );
}
