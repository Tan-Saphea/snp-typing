import { useCallback, useEffect, useState } from "react";
import { LuArrowLeft, LuBookOpen, LuCircleCheckBig, LuLockKeyhole, LuStar } from "react-icons/lu";
import { Link, useParams } from "../components/NextRouter.jsx";

import { EmptyState, PageError, PageLoader } from "../components/AsyncState.jsx";
import LearningCategoryCard, { learningCardPalette, learningCardPatterns } from "../components/LearningCategoryCard.jsx";
import PageHero from "../components/PageHero.jsx";
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
      <div className="mt-4"><PageHero
        actions={<div className="w-full min-w-64 rounded-2xl border-2 border-slate-900 bg-white p-4 text-slate-900 shadow-[0_4px_0_0_#172033] sm:w-72"><ProgressBar color={language === "km" ? "bg-violet-600" : "bg-sky-600"} label={`${completed}/${state.lessons.length} complete`} value={(completed / state.lessons.length) * 100} /><p className="mt-2 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">70% accuracy to pass</p></div>}
        badges={[
          { icon: LuBookOpen, label: `${state.lessons.length} lessons` },
          { icon: LuStar, label: `${state.lessons.length * 3} stars available` },
        ]}
        description={level.description}
        eyebrow={`Level ${level.level}`}
        icon={LuBookOpen}
        title={level.title}
        tone={language === "km" ? "violet" : "sky"}
      /></div>
      <div className="snp-learning-grid mt-6">{state.lessons.map((lesson, index) => {
        const color = learningCardPalette[index % learningCardPalette.length];
        return (
          <LearningCategoryCard
            accent={color.accent}
            actionLabel={lesson.progress.passed ? "Practice again" : "Start lesson"}
            badge={lesson.isLocked ? "Locked" : lesson.progress.passed ? "✓" : String(index + 1).padStart(2, "0")}
            className={`snp-learning-card-compact ${lesson.isLocked ? "snp-learning-card-locked" : ""}`}
            deep={color.deep}
            description={lesson.instructions}
            footer={lesson.isLocked ? <div className="snp-learning-card-locked-footer"><LuLockKeyhole /><span>Pass {lesson.unlockRequirement?.title || "the previous lesson"} first</span></div> : undefined}
            href={lesson.isLocked ? undefined : `/lessons/${lesson.id}`}
            key={lesson.id}
            pattern={learningCardPatterns[index % learningCardPatterns.length]}
            subtitle={lesson.titleKhmer || `${languageLabel(language)} · ${lesson.difficulty}`}
            title={`Lesson ${lesson.order}: ${lesson.title}`}
            visual={lesson.isLocked ? <LuLockKeyhole /> : lesson.progress.passed ? <LuCircleCheckBig /> : <span>{lesson.order}</span>}
          >
            <div className="snp-learning-card-meta"><span><Stars count={lesson.progress.bestStars} /></span><span>{lesson.progress.attempts} attempts</span><span>{lesson.minimumAccuracy ?? 70}% goal</span></div>
          </LearningCategoryCard>
        );
      })}</div>
    </div>
  );
}
