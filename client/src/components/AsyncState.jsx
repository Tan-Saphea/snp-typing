import { LuKeyboard, LuRefreshCw, LuTriangleAlert } from "react-icons/lu";

export function PageLoader({ message = "Loading your lessons…" }) {
  return (
    <div className="snp-card grid min-h-64 place-items-center p-8" role="status">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
        <p className="mt-4 font-semibold text-slate-600">{message}</p>
      </div>
    </div>
  );
}

export function PageError({ message, onRetry }) {
  return (
    <div className="snp-card border-red-200 bg-red-50 p-8 text-center" role="alert">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-xl font-black text-red-700"><LuTriangleAlert aria-hidden="true" /></div>
      <h2 className="mt-4 text-xl font-black text-red-900">We could not load this page</h2>
      <p className="mx-auto mt-2 max-w-lg text-red-700">{message}</p>
      {onRetry && <button className="snp-button-secondary mt-5" onClick={onRetry} type="button"><LuRefreshCw />Try again</button>}
    </div>
  );
}

export function EmptyState({ title, message }) {
  return (
    <div className="snp-card p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl text-slate-600"><LuKeyboard aria-hidden="true" /></div>
      <h2 className="mt-4 text-xl font-black text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-slate-600">{message}</p>
    </div>
  );
}
