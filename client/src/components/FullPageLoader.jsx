import { LuKeyboard } from "react-icons/lu";

export default function FullPageLoader({ message = "Loading…" }) {
  return (
    <main
      className="snp-app-canvas grid min-h-screen place-items-center p-6"
      aria-busy="true"
    >
      <div className="snp-result-dialog w-full max-w-sm p-8 text-center">
        <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border-2 border-slate-900 bg-primary-600 text-white shadow-[0_5px_0_0_#172033]" aria-hidden="true"><LuKeyboard size={27} /><span className="absolute -inset-2 animate-spin rounded-[1.35rem] border-2 border-transparent border-t-primary-500" /></div>
        <p className="mt-5 font-black text-slate-700">{message}</p>
        <p className="mt-1 text-xs font-bold text-slate-400">SNP Typing</p>
      </div>
    </main>
  );
}
