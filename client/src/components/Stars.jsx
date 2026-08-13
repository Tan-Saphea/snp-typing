import { LuStar } from "react-icons/lu";

export default function Stars({ count = 0, showValue = false, size = 15 }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-label={`${count} out of 3 stars`}>
      {[1, 2, 3].map((star) => <LuStar aria-hidden="true" fill={star <= count ? "currentColor" : "none"} key={star} size={size} className={star <= count ? "" : "text-slate-300"} />)}
      {showValue && <span className="ml-1 text-sm font-black text-amber-600">{count}</span>}
    </span>
  );
}
