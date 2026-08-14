import { LuKeyboard, LuRefreshCw, LuTriangleAlert } from "react-icons/lu";

export function PageLoader({ message = "Loading your lessons…" }) {
  return (
    <div className="snp-card grid min-h-72 place-items-center overflow-hidden p-8" role="status">
      <div className="text-center">
        <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border-2 border-slate-900 bg-primary-50 shadow-[0_4px_0_0_#7167f6]"><LuKeyboard className="text-primary-700" size={27} /><span className="absolute -inset-2 animate-spin rounded-[1.4rem] border-2 border-transparent border-t-primary-500" /></div>
        <p className="mt-5 font-black text-slate-700">{message}</p>
        <p className="mt-1 text-xs font-bold text-slate-400">Getting your learning space ready</p>
      </div>
    </div>
  );
}

export function PageError({ message, onRetry }) {
  return (
    <div className="snp-card border-red-700 bg-red-50 p-8 text-center shadow-[0_5px_0_0_#ef4444]" role="alert">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 border-red-700 bg-red-100 text-xl font-black text-red-700 shadow-[0_3px_0_0_#fca5a5]"><LuTriangleAlert aria-hidden="true" /></div>
      <h2 className="mt-4 text-xl font-black text-red-900">We could not load this page</h2>
      <p className="mx-auto mt-2 max-w-lg text-red-700">{message}</p>
      {onRetry && <button className="snp-button-secondary mt-5" onClick={onRetry} type="button"><LuRefreshCw />Try again</button>}
    </div>
  );
}

export function EmptyState({ title, message }) {
  return (
    <div className="snp-card p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-2 border-slate-900 bg-slate-100 text-2xl text-slate-600 shadow-[0_3px_0_0_#cbd5e1]"><LuKeyboard aria-hidden="true" /></div>
      <h2 className="mt-4 text-xl font-black text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-slate-600">{message}</p>
    </div>
  );
}
