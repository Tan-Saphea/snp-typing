import { LuArrowLeft, LuKeyboardOff, LuLayoutDashboard } from "react-icons/lu";
import { Link } from "../components/NextRouter.jsx";

export default function NotFoundPage() {
  return (
    <main className="snp-app-canvas grid min-h-screen place-items-center p-6">
      <section className="snp-result-dialog relative max-w-lg overflow-hidden p-8 text-center sm:p-10">
        <div className="pointer-events-none absolute -right-8 -top-8 text-9xl font-black text-primary-600/[0.06]">404</div>
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border-2 border-slate-900 bg-amber-200 text-3xl text-amber-900 shadow-[0_5px_0_0_#f59e0b]"><LuKeyboardOff /></span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-primary-600">Error 404</p>
        <h1 className="mt-3 text-3xl font-black text-ink">Page not found</h1>
        <p className="mt-4 text-slate-600">
          The requested SNP Typing screen does not exist.
        </p>
        <Link className="snp-button-primary mt-6" to="/">
          <LuLayoutDashboard />Return to dashboard<LuArrowLeft className="rotate-180" />
        </Link>
      </section>
    </main>
  );
}
