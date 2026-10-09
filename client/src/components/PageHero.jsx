import { Space, Tag, Typography } from "antd";

const { Paragraph, Title } = Typography;

const toneStyles = {
  emerald: "from-[#141414] via-[#1b3022] to-[#2e7d32] text-white border-emerald-800/40",
  ink: "from-[#141414] via-[#1a1e29] to-[#0f172a] text-white border-slate-700/50",
  sky: "from-[#0f172a] via-[#132742] to-[#0369a1] text-white border-sky-800/40",
  violet: "from-[#141414] via-[#24133b] to-[#6b21a8] text-white border-purple-800/40",
  amber: "from-[#141414] via-[#2c1d11] to-[#c2410c] text-white border-amber-800/40",
};

export default function PageHero({
  actions,
  badges = [],
  description,
  eyebrow,
  icon: Icon,
  title,
  tone = "emerald",
}) {
  const gradient = toneStyles[tone] ?? toneStyles.emerald;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r ${gradient} p-6 sm:p-8 shadow-md`}
    >
      <div className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full border-[36px] border-white/10" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      {Icon && (
        <Icon
          className="pointer-events-none absolute -bottom-10 right-5 hidden opacity-[0.08] sm:block text-white"
          size={220}
          strokeWidth={1.3}
        />
      )}

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="m-0 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-400">
              {Icon && <Icon aria-hidden="true" size={15} />}
              {eyebrow}
            </p>
          )}
          <h1 className="m-0 mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl text-white">
            {title}
          </h1>
          {description && (
            <p className="m-0 mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-300 sm:text-base">
              {description}
            </p>
          )}
          {badges.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {badges.map(({ icon: BadgeIcon, label }) => (
                <Tag
                  variant="filled"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm m-0"
                  key={label}
                >
                  {BadgeIcon && <BadgeIcon aria-hidden="true" size={14} className="text-emerald-300" />}
                  <span>{label}</span>
                </Tag>
              ))}
            </div>
          )}
        </div>
        {actions && (
          <div className="relative z-10 flex shrink-0 flex-wrap gap-3 items-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
