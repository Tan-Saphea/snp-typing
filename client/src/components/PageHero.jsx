const toneClasses = {
  amber: "from-amber-300 via-orange-200 to-rose-200 text-slate-950",
  emerald: "from-emerald-500 via-emerald-400 to-teal-300 text-emerald-950",
  ink: "from-slate-900 via-slate-800 to-indigo-950 text-white",
  sky: "from-sky-500 via-blue-500 to-indigo-600 text-white",
  violet: "from-violet-600 via-indigo-600 to-blue-600 text-white",
};

export default function PageHero({
  actions,
  badges = [],
  description,
  eyebrow,
  icon: Icon,
  title,
  tone = "ink",
}) {
  const darkSurface = ["ink", "sky", "violet"].includes(tone);

  return (
    <section className={`snp-page-hero relative overflow-hidden bg-gradient-to-br ${toneClasses[tone] ?? toneClasses.ink}`}>
      <div className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full border-[42px] border-white/10" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      {Icon && <Icon className="pointer-events-none absolute -bottom-10 right-5 hidden opacity-[0.09] sm:block" size={210} strokeWidth={1.35} />}

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] ${darkSurface ? "text-emerald-300" : "text-slate-700"}`}>
            {Icon && <Icon aria-hidden="true" size={16} />}
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl lg:text-5xl">{title}</h1>
          {description && <p className={`mt-3 max-w-2xl text-sm font-semibold leading-6 sm:text-base ${darkSurface ? "text-slate-300" : "text-slate-700"}`}>{description}</p>}
          {badges.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map(({ icon: BadgeIcon, label }) => (
                <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${darkSurface ? "border-white/20 bg-white/10 text-white" : "border-slate-900/20 bg-white/50 text-slate-800"}`} key={label}>
                  {BadgeIcon && <BadgeIcon aria-hidden="true" size={15} />}
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="relative z-10 flex shrink-0 flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}
