import { useEffect, useState } from "react";
import { LuArrowRight, LuBookOpen, LuClipboardCheck, LuSparkles, LuUsers } from "react-icons/lu";
import { Link } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getReport } from "../services/managementService.js";
import { useAuthStore } from "../stores/authStore.js";

export default function TeacherDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => { getReport().then((data) => setState({ loading: false, data, error: "" })).catch((error) => setState({ loading: false, data: null, error: getApiErrorMessage(error) })); }, []);
  useEffect(() => {
    if (user && sessionStorage.getItem("snp-just-logged-in") === "true") {
      setShowWelcome(true);
      sessionStorage.removeItem("snp-just-logged-in");
    }
  }, [user]);

  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-5 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="snp-modal-card w-full max-w-md p-7 text-center animate-in zoom-in-95 duration-200">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border-2 border-slate-900 bg-emerald-200 text-3xl text-emerald-900 shadow-[0_4px_0_0_#34d399]">
            🏫
          </div>
          <h2 className="mt-5 text-2xl font-black text-ink">Welcome, Teacher {user?.firstName || user?.username}!</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Ready to manage lessons, schedule assignments, and monitor your students' typing speeds today?
          </p>
          <div className="mt-6">
            <button
              className="snp-button-primary w-full py-3 text-base flex justify-center items-center gap-2"
              onClick={() => setShowWelcome(false)}
              type="button"
            >
              <LuSparkles /> Open Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.loading) return <PageLoader message="Preparing the teacher dashboard…" />;
  if (state.error) return <PageError message={state.error} />;
  const { summary, results } = state.data;
  const cards = [["Total Students", summary.students, "bg-sky-100 text-sky-800"], ["Active Classes", summary.classes, "bg-emerald-100 text-emerald-800"], ["Published Lessons", summary.lessons, "bg-violet-100 text-violet-800"], ["Average Accuracy", `${Math.round(summary.averageAccuracy)}%`, "bg-amber-100 text-amber-800"], ["Average WPM", Math.round(summary.averageWpm), "bg-rose-100 text-rose-800"], ["Average Khmer CPM", Math.round(summary.averageCpm), "bg-cyan-100 text-cyan-800"]];
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="snp-teacher-hero relative overflow-hidden p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border-[38px] border-emerald-300/20" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300"><LuSparkles />Teacher Workspace</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Welcome, {user.firstName || user.username}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Manage learning, support your students, and monitor real classroom results.</p>
          </div>
          <Link className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl border-2 border-slate-900 bg-emerald-300 px-5 py-3 font-black text-emerald-950 shadow-[0_4px_0_0_#059669] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none" to="/reports">View reports <LuArrowRight /></Link>
        </div>
      </section>

      {/* Stats Summary Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value, accent], index) => (
          <article className="snp-card flex min-h-32 flex-col justify-between p-5" key={label}>
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-xl border border-slate-900 ${accent}`}>{index + 1}</span></div>
            <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-ink">{value}</p>
          </article>
        ))}
      </section>

      {/* Action Quick Links */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["/students", "Students", "Manage accounts and passwords", LuUsers, "border-sky-900 bg-sky-50 text-sky-900 shadow-[0_5px_0_0_#7dd3fc]"],
          ["/assignments", "Assignments", "Assign lessons, levels, tests, or practice", LuClipboardCheck, "border-violet-900 bg-violet-50 text-violet-900 shadow-[0_5px_0_0_#c4b5fd]"],
          ["/lesson-manager", "Lesson Manager", "Publish and review curriculum", LuBookOpen, "border-emerald-900 bg-emerald-50 text-emerald-900 shadow-[0_5px_0_0_#6ee7b7]"]
        ].map(([to, title, note, Icon, accent]) => (
          <Link 
            className={`flex min-h-40 flex-col justify-between rounded-2xl border-2 p-5 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${accent}`}
            to={to} 
            key={to}
          >
            <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl border-2 border-current bg-white/70"><Icon size={21} /></span><LuArrowRight size={21} /></div>
            <div><h2 className="text-lg font-black">{title}</h2><p className="mt-1 text-sm font-semibold opacity-75">{note}</p></div>
          </Link>
        ))}
      </section>
 
      {/* Recent Results */}
      <section className="snp-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Recent Results</h2>
          <Link className="font-black text-primary-700 hover:underline" to="/reports">
            View reports
          </Link>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {results.slice(0, 6).map((result) => (
            <div className="flex items-center gap-4 py-3" key={result.id}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-slate-800">
                  {result.student?.firstName} {result.student?.lastName} · {result.lesson?.title}
                </p>
                <p className="text-xs font-semibold text-slate-400">
                  {new Date(result.completedAt).toLocaleString()}
                </p>
              </div>
              <p className="rounded-xl bg-emerald-100 px-3 py-1.5 font-black text-emerald-800">{Math.round(result.accuracy)}%</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
