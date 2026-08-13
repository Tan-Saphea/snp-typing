import { useCallback, useEffect, useMemo, useState } from "react";
import { LuArrowRight, LuBookOpen, LuGraduationCap, LuLanguages, LuLockKeyhole, LuStar } from "react-icons/lu";
import { Link } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { curriculumLevels, isCurriculumLesson, languageLabel } from "../data/curriculum.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

export default function TypingLevelsPage({ language }) {
  const [state, setState] = useState({ loading: true, lessons: [], error: "" });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try { setState({ loading: false, lessons: await listLessons({ language }), error: "" }); }
    catch (error) { setState({ loading: false, lessons: [], error: getApiErrorMessage(error) }); }
  }, [language]);
  useEffect(() => { void load(); }, [load]);

  const summaries = useMemo(() => curriculumLevels[language].map((level) => {
    const lessons = state.lessons.filter((lesson) => lesson.level === level.level && isCurriculumLesson(lesson));
    const completed = lessons.filter((lesson) => lesson.progress.passed).length;
    return { ...level, lessons, completed, percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0, stars: lessons.reduce((sum, lesson) => sum + lesson.progress.bestStars, 0), locked: lessons.length === 0 || lessons.every((lesson) => lesson.isLocked) };
  }), [language, state.lessons]);

  if (state.loading) return <PageLoader />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const basePath = language === "km" ? "khmer" : "english";
  return (
    <div>
      <section className={`snp-panel-shell relative overflow-hidden rounded-xl p-6 text-white sm:p-8 ${language === "km" ? "bg-gradient-to-r from-violet-700 to-indigo-600" : "bg-gradient-to-r from-primary-700 to-sky-500"}`}><div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-white/10 blur-xl" /><div className="relative flex items-center gap-5"><span className="hidden h-16 w-16 shrink-0 place-items-center rounded-xl border-2 border-white/20 bg-white/10 text-white shadow-[0_2px_0_0_rgba(255,255,255,0.1)] sm:grid">{language === "km" ? <LuLanguages size={30} /> : <LuGraduationCap size={30} />}</span><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/75 sm:text-sm">Learning Path</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{languageLabel(language)}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">Complete lessons in order, build accuracy, and earn three stars on every activity.</p></div></div></section>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">{summaries.map((level) => (
        <article className={`snp-card group p-5 transition sm:p-6 ${level.locked ? "opacity-75" : ""}`} key={level.level}>
          <div className="flex gap-4 sm:gap-5"><div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-slate-800 text-lg font-black shadow-[0_2px_0_0_#334155] sm:h-16 sm:w-16 ${level.locked ? "bg-slate-100 text-slate-500" : language === "km" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>{level.locked ? <LuLockKeyhole size={22} /> : level.icon}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Level {level.level}</p><h2 className="mt-1 truncate text-lg font-black text-ink sm:text-xl">{level.title}</h2></div><span className="inline-flex shrink-0 items-center gap-1 text-sm font-black text-amber-600"><LuStar fill="currentColor" />{level.stars}</span></div><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-slate-600">{level.description}</p></div></div>
          <div className="mt-5"><ProgressBar value={level.percent} /></div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><LuBookOpen />{level.lessons.length ? `${level.completed}/${level.lessons.length} lessons` : "Curriculum in preparation"}</p>{level.locked ? <span className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-350 bg-slate-100 px-4 py-2 text-sm font-black text-slate-500"><LuLockKeyhole />Locked</span> : <Link className="snp-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm" to={`/${basePath}/level/${level.level}`}>View lessons <LuArrowRight /></Link>}</div>
        </article>
      ))}</div>
    </div>
  );
}
