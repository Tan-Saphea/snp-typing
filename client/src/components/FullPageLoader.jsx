import { LuKeyboard } from "react-icons/lu";

export default function FullPageLoader({ message = "Loading…" }) {
  return (
    <main
      className="grid min-h-screen place-items-center bg-slate-50 p-6"
      aria-busy="true"
    >
      <div className="text-center">
        <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/25" aria-hidden="true"><LuKeyboard size={27} /><span className="absolute inset-[-7px] animate-ping rounded-3xl border border-primary-500/30" /></div>
        <p className="mt-4 font-semibold text-slate-600">{message}</p>
      </div>
    </main>
  );
}
