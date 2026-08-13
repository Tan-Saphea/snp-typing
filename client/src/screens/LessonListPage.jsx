import { useCallback, useEffect, useState } from "react";
import { LuArrowLeft, LuBookOpen, LuCircleCheckBig, LuLockKeyhole, LuPlay, LuRotateCcw } from "react-icons/lu";
import { Link, useParams } from "../components/NextRouter.jsx";

import { EmptyState, PageError, PageLoader } from "../components/AsyncState.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import Stars from "../components/Stars.jsx";
import { getLevel, isCurriculumLesson, languageLabel } from "../data/curriculum.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

export default function LessonListPage({ language }) {
  const { level: levelParam } = useParams();
  const levelNumber = Number(levelParam);
  const level = getLevel(language, levelNumber);
  const [state, setState] = useState({ loading: true, lessons: [], error: "" });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try { setState({ loading: false, lessons: (await listLessons({ language, level: levelNumber })).filter(isCurriculumLesson), error: "" }); }
    catch (error) { setState({ loading: false, lessons: [], error: getApiErrorMessage(error) }); }
  }, [language, levelNumber]);
  useEffect(() => { void load(); }, [load]);

  if (state.loading) return <PageLoader />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;
  if (!level || !state.lessons.length) return <EmptyState title="Lessons are being prepared" message="This level is part of the planned curriculum and will be added in a later content phase." />;

  const completed = state.lessons.filter((lesson) => lesson.progress.passed).length;
  const backPath = language === "km" ? "/khmer" : "/english";
  return (
    <div>
      <Link className="inline-flex items-center gap-2 text-sm font-black text-primary-700 hover:underline" to={backPath}><LuArrowLeft />Back to {languageLabel(language)}</Link>
      <section className="snp-panel-shell mt-4 grid gap-5 rounded-xl bg-white p-5 sm:p-6 lg:grid-cols-[1fr_280px] lg:items-end"><div><p className="snp-kicker">Level {level.level}</p><h1 className="snp-page-heading mt-2">{level.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{level.description}</p></div><div><ProgressBar label={`${completed}/${state.lessons.length} complete`} value={(completed / state.lessons.length) * 100} /><p className="mt-2 text-right text-xs font-bold text-slate-400">Pass lessons with at least 70% accuracy</p></div></section>
      <div className="mt-5 space-y-3">{state.lessons.map((lesson, index) => (
        <article className={`snp-card group flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:gap-5 sm:p-5 ${lesson.isLocked ? "opacity-70" : ""}`} key={lesson.id}>
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border-2 border-slate-800 shadow-[0_2px_0_0_#334155] text-lg font-black sm:h-14 sm:w-14 ${lesson.progress.passed ? "bg-emerald-100 text-emerald-700" : lesson.isLocked ? "bg-slate-100 text-slate-500" : "bg-primary-100 text-primary-700"}`}>{lesson.progress.passed ? <LuCircleCheckBig /> : lesson.isLocked ? <LuLockKeyhole /> : index + 1}</div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="min-w-0 truncate text-base font-black sm:text-lg">Lesson {lesson.order}: {lesson.title}</h2>{lesson.progress.passed && <span className="rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">Complete</span>}</div><p className="mt-1 line-clamp-2 text-sm text-slate-500 sm:truncate">{lesson.instructions}</p><div className="mt-2 flex items-center gap-3 text-xs font-bold text-slate-400 sm:hidden"><Stars count={lesson.progress.bestStars} /><span>{lesson.progress.attempts} attempts</span></div></div>
          <div className="hidden shrink-0 text-right sm:block"><Stars count={lesson.progress.bestStars} /><p className="mt-1 text-xs font-bold text-slate-500">{lesson.progress.attempts} attempts</p></div>
          <div className="ml-16 w-[calc(100%_-_4rem)] shrink-0 sm:ml-0 sm:w-28">{lesson.isLocked ? <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-350 bg-slate-100 px-3 text-sm font-black text-slate-500"><LuLockKeyhole />Locked</span> : <Link className="snp-button-primary min-h-11 w-full px-3 py-2 text-sm" to={`/lessons/${lesson.id}`}>{lesson.progress.passed ? <LuRotateCcw /> : <LuPlay fill="currentColor" />}{lesson.progress.passed ? "Practice" : "Start"}</Link>}</div>
        </article>
      ))}</div>
    </div>
  );
}
