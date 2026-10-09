import { Progress } from "antd";

export default function ProgressBar({
  value = 0,
  label = "Progress",
  strokeColor = "#52c41a",
  railColor,
  trailColor,
}) {
  const safeValue = Math.min(100, Math.max(0, Math.round(value)));
  const effectiveRailColor = railColor || trailColor;

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
          <span>{label}</span>
          <span className="font-extrabold text-slate-800 dark:text-slate-200">{safeValue}%</span>
        </div>
      )}
      <Progress
        percent={safeValue}
        showInfo={false}
        strokeColor={strokeColor}
        railColor={effectiveRailColor}
        size={["100%", 10]}
        status={safeValue === 100 ? "success" : "active"}
      />
    </div>
  );
}
