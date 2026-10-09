import { Button, Card, Tag } from "antd";
import { LuArrowRight } from "react-icons/lu";

import { Link } from "./NextRouter.jsx";

export const learningCardPalette = [
  { accent: "#52c41a", deep: "#237804" }, // Green
  { accent: "#1677ff", deep: "#0958d9" }, // Blue
  { accent: "#fa8c16", deep: "#d46b08" }, // Orange
  { accent: "#722ed1", deep: "#531dab" }, // Purple
  { accent: "#eb2f96", deep: "#c41d7f" }, // Magenta
  { accent: "#13c2c2", deep: "#08979c" }, // Cyan
  { accent: "#faad14", deep: "#d48806" }, // Gold
  { accent: "#2f54eb", deep: "#1d39c4" }, // Geekblue
];

export const learningCardPatterns = ["checker", "stripes", "tiles", "columns"];

export default function LearningCategoryCard({
  accent = learningCardPalette[0].accent,
  actionLabel = "Learn now",
  badge,
  children,
  className = "",
  deep = learningCardPalette[0].deep,
  description,
  footer,
  href,
  pattern = "checker",
  subtitle,
  title,
  visual,
}) {
  return (
    <Card
      variant="outlined"
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 ${className}`}
      styles={{
        body: { padding: "20px", display: "flex", flexDirection: "column", height: "100%" },
      }}
    >
      <div
        className={`relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br`}
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, ${deep} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
        {badge && (
          <span className="absolute left-3 top-3 rounded-md bg-black/40 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
            {badge}
          </span>
        )}
        <div className="relative z-10 text-5xl text-white drop-shadow-md">
          {visual}
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {subtitle && (
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {subtitle}
          </p>
        )}
        <h3 className="m-0 mt-1 text-lg font-black tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="m-0 mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}

        <div className="mt-4 flex-1">{children}</div>

        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          {footer ??
            (href ? (
              <Link to={href} className="block w-full">
                <Button
                  type="primary"
                  className="w-full flex items-center justify-center gap-2 font-bold"
                >
                  <span>{actionLabel}</span>
                  <LuArrowRight size={15} />
                </Button>
              </Link>
            ) : null)}
        </div>
      </div>
    </Card>
  );
}
