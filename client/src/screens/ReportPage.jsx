import { useCallback, useEffect, useState } from "react";
import { Button, Progress } from "antd";
import {
  LuFileText,
  LuPrinter,
  LuShieldCheck,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import PageHero from "../components/PageHero.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getMyProgress } from "../services/progressService.js";
import { useAuthStore } from "../stores/authStore.js";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ReportPage() {
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState({ loading: true, progress: null, error: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setState({ loading: false, progress: await getMyProgress(), error: "" });
    } catch (error) {
      setState({ loading: false, progress: null, error: getApiErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading) return <PageLoader message="Preparing printable A4 report…" />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const { progress } = state;
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username;
  const learnerId = user?.studentId || (user?.id ? user.id.slice(-8).toUpperCase() : "SNP-STUDENT");
  const generatedAt = new Date();

  return (
    <div className="space-y-6">
      <div className="snp-print-hidden">
        <PageHero
          actions={
            <Button
              type="primary"
              size="large"
              icon={<LuPrinter size={16} />}
              onClick={() => window.print()}
              className="font-bold flex items-center gap-2 h-11"
            >
              Print / Save PDF
            </Button>
          }
          badges={[
            { icon: LuFileText, label: "ទម្រង់ស្តង់ដា A4 (Standard A4 Format)" },
            { icon: LuShieldCheck, label: "កំណត់ត្រាផ្លូវការ (Official Learner Record)" },
          ]}
          description="របាយការណ៍វឌ្ឍនភាពនៃការសិក្សាជាផ្លូវការ បង្ហាញពីសមត្ថភាពវាយអក្សរ ល្បឿន ភាពត្រឹមត្រូវ និងការបញ្ចប់មេរៀនតាមមុខវិជ្ជា។"
          eyebrow="Printable Record"
          icon={LuFileText}
          title="A4 Progress Report (របាយការណ៍វឌ្ឍនភាព)"
          tone="emerald"
        />
      </div>

      <div className="snp-report-stage flex justify-center">
        <article
          className="snp-report-sheet w-full max-w-[840px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-8 sm:p-12 shadow-md text-slate-800 dark:text-slate-200"
          aria-label="A4 learner progress report"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-2 border-slate-900 dark:border-slate-700 gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="SNP Typing Logo"
                className="h-16 w-auto object-contain shrink-0"
              />
              <div>
                <h2 className="m-0 text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  SNP TYPING ACADEMY
                </h2>
                <p className="m-0 text-xs font-bold text-slate-600 dark:text-slate-400">
                  សាលាអន្តរជាតិ អេស អ៊ិន ភី • SNP International School
                </p>
                <p className="m-0 text-[11px] font-semibold text-[#52c41a] mt-0.5">
                  English & Khmer Typing Education
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#52c41a]" />
                Official Learner Record
              </div>
              <h1 className="m-0 text-xl font-black text-slate-900 dark:text-white">
                របាយការណ៍វឌ្ឍនភាពនៃការសិក្សា
              </h1>
              <p className="m-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Student Progress & Competency Report
              </p>
              <p className="m-0 text-[11px] text-slate-400 mt-1">
                កាលបរិច្ឆេទចេញ (Date): {formatDate(generatedAt)}
              </p>
            </div>
          </div>

          {/* Student Profile Section */}
          <div className="my-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ឈ្មោះសិស្ស (Learner Name)
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                    {fullName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ឈ្មោះខ្មែរ (Khmer Name)
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
                    {user?.khmerName || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ឈ្មោះគណនី (Username)
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    @{user?.username}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    លេខសម្គាល់ (Learner ID)
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {learnerId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 1. Academic Performance Summary */}
          <div className="my-6">
            <h3 className="m-0 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              សង្ខេបលទ្ធផល និងសមត្ថភាព (Academic Performance Summary)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-center">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">មេរៀនជាប់ (Lessons Passed)</p>
                <p className="m-0 mt-1 text-2xl font-black text-slate-900 dark:text-white">{progress.stats.lessonsCompleted}</p>
                <p className="m-0 text-[10px] text-slate-400 font-medium">សរុបមេរៀនដែលបានរៀនចប់</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-center">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">ល្បឿនអង់គ្លេស (English Speed)</p>
                <p className="m-0 mt-1 text-2xl font-black text-slate-900 dark:text-white">{Math.round(progress.stats.bestWpm)} <span className="text-xs font-bold text-slate-400">WPM</span></p>
                <p className="m-0 text-[10px] text-slate-400 font-medium">ពាក្យក្នុងមួយនាទី</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-center">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">ល្បឿនខ្មែរ (Khmer Speed)</p>
                <p className="m-0 mt-1 text-2xl font-black text-slate-900 dark:text-white">{Math.round(progress.stats.bestCpm)} <span className="text-xs font-bold text-slate-400">CPM</span></p>
                <p className="m-0 text-[10px] text-slate-400 font-medium">តួអក្សរក្នុងមួយនាទី</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-center">
                <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">ភាពត្រឹមត្រូវ (Accuracy)</p>
                <p className="m-0 mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">{Math.round(progress.stats.averageAccuracy)}%</p>
                <p className="m-0 text-[10px] text-slate-400 font-medium">ភាពសុក្រឹតជាមធ្យម</p>
              </div>
            </div>
          </div>

          {/* 2. Course & Track Completion */}
          <div className="my-6">
            <h3 className="m-0 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              វឌ្ឍនភាពតាមមុខវិជ្ជា (Curriculum Completion Breakdown)
            </h3>
            <div className="space-y-2.5">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-64">
                  <p className="m-0 font-bold text-sm text-slate-900 dark:text-white">វាយអក្សរអង់គ្លេស (English Typing)</p>
                  <p className="m-0 text-[11px] text-slate-400">
                    ជាប់ {progress.languages.en.completedLessons} នៃ {progress.languages.en.totalLessons} មេរៀន
                  </p>
                </div>
                <div className="flex-1 w-full flex items-center gap-3">
                  <div className="flex-1">
                    <Progress percent={progress.languages.en.percent} strokeColor="#52c41a" showInfo={false} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-10 text-right">{progress.languages.en.percent}%</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-64">
                  <p className="m-0 font-bold text-sm text-slate-900 dark:text-white">វាយអក្សរខ្មែរ (Khmer Typing)</p>
                  <p className="m-0 text-[11px] text-slate-400">
                    ជាប់ {progress.languages.km.completedLessons} នៃ {progress.languages.km.totalLessons} មេរៀន
                  </p>
                </div>
                <div className="flex-1 w-full flex items-center gap-3">
                  <div className="flex-1">
                    <Progress percent={progress.languages.km.percent} strokeColor="#52c41a" showInfo={false} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-10 text-right">{progress.languages.km.percent}%</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-64">
                  <p className="m-0 font-bold text-sm text-slate-900 dark:text-white">ជំនាញកុំព្យូទ័រ & សំណួរ (Computer Skills & Quizzes)</p>
                  <p className="m-0 text-[11px] text-slate-400">
                    ជាប់ {progress.computerSkills.completedLessons} នៃ {progress.computerSkills.totalLessons} សកម្មភាព
                  </p>
                </div>
                <div className="flex-1 w-full flex items-center gap-3">
                  <div className="flex-1">
                    <Progress percent={progress.computerSkills.percent} strokeColor="#52c41a" showInfo={false} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-10 text-right">{progress.computerSkills.percent}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Recent Evaluation Log */}
          <div className="my-6">
            <h3 className="m-0 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              កំណត់ត្រាលទ្ធផលមេរៀនចុងក្រោយ (Recent Evaluation Log)
            </h3>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">មេរៀន / សកម្មភាព (Activity)</th>
                    <th className="py-2.5 px-3">កាលបរិច្ឆេទ (Date)</th>
                    <th className="py-2.5 px-3">ល្បឿន (Speed)</th>
                    <th className="py-2.5 px-3">ភាពត្រឹមត្រូវ (Accuracy)</th>
                    <th className="py-2.5 px-3 text-right">និទ្ទេស (Stars)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {progress.recent && progress.recent.slice(0, 5).map((item, index) => {
                    const isKhmer = item.lesson?.language === "km";
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{index + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {item.lesson?.title || "Archived lesson"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{formatDate(item.completedAt)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {isKhmer ? `${Math.round(item.cpm)} CPM` : `${Math.round(item.wpm)} WPM`}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.round(item.accuracy)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-amber-500">
                          {item.stars} / 3 ★
                        </td>
                      </tr>
                    );
                  })}
                  {(!progress.recent || progress.recent.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        មិនទាន់មានកំណត់ត្រាមេរៀននៅឡើយទេ (No completed lessons yet)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Verification & Signatures */}
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="m-0 text-[11px] text-slate-400 text-center mb-8 italic">
              ឯកសារនេះត្រូវបានបង្កើតឡើងដោយស្វ័យប្រវត្តិតាមរយៈប្រព័ន្ធ SNP Typing Education Platform ដើម្បីបញ្ជាក់ពីលទ្ធផលនៃការសិក្សា។
            </p>
            <div className="grid grid-cols-2 gap-12 text-center text-xs text-slate-600 dark:text-slate-400">
              <div>
                <div className="border-b border-dashed border-slate-400 dark:border-slate-600 h-12 mb-2" />
                <p className="m-0 font-bold text-slate-800 dark:text-slate-200">ហត្ថលេខាសិស្ស</p>
                <p className="m-0 text-[10px] text-slate-400">Learner Signature</p>
              </div>
              <div>
                <div className="border-b border-dashed border-slate-400 dark:border-slate-600 h-12 mb-2" />
                <p className="m-0 font-bold text-slate-800 dark:text-slate-200">ហត្ថលេខាគ្រូបង្រៀន / អ្នកវាយតម្លៃ</p>
                <p className="m-0 text-[10px] text-slate-400">Teacher / Evaluator Signature</p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
