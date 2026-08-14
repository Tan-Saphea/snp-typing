const tones = {
  amber: "bg-amber-200 text-amber-900 shadow-[0_3px_0_0_#f59e0b]",
  emerald: "bg-emerald-200 text-emerald-900 shadow-[0_3px_0_0_#10b981]",
  rose: "bg-rose-200 text-rose-900 shadow-[0_3px_0_0_#fb7185]",
  sky: "bg-sky-200 text-sky-900 shadow-[0_3px_0_0_#38bdf8]",
  violet: "bg-violet-200 text-violet-900 shadow-[0_3px_0_0_#8b5cf6]",
};

export default function MetricCard({ icon: Icon, label, note, tone = "sky", value }) {
  return (
    <article className="snp-card snp-metric-card flex min-w-0 items-center gap-4 p-4 sm:p-5">
      {Icon && <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-slate-900 ${tones[tone] ?? tones.sky}`}><Icon aria-hidden="true" size={21} /></span>}
      <div className="min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">{label}</p>
        <p className="mt-1 truncate text-2xl font-black tracking-[-0.04em] text-ink">{value}</p>
        {note && <p className="mt-1 truncate text-xs font-bold text-slate-400">{note}</p>}
      </div>
    </article>
  );
}
