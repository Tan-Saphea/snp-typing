import { Card, Statistic } from "antd";

const toneStyles = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  amber: "bg-orange-500/10 text-[#fa8c16] border-orange-500/20",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  violet: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

export default function MetricCard({
  icon: Icon,
  label,
  note,
  tone = "emerald",
  value,
  className = "",
}) {
  const iconClass = toneStyles[tone] ?? toneStyles.emerald;

  return (
    <Card
      variant="outlined"
      className={`rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 ${className}`}
      styles={{ body: { padding: "20px" } }}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div
            className={`grid h-13 w-13 shrink-0 place-items-center rounded-2xl border p-3 ${iconClass}`}
          >
            <Icon aria-hidden="true" size={24} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="m-0 mt-0.5 truncate text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {note && (
            <p className="m-0 mt-0.5 truncate text-xs font-medium text-slate-400">
              {note}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
