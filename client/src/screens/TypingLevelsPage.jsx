import { useCallback, useEffect, useMemo, useState } from "react";
import { LuBookOpen, LuGraduationCap, LuLanguages, LuLockKeyhole, LuStar } from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import LearningCategoryCard, { learningCardPalette, learningCardPatterns } from "../components/LearningCategoryCard.jsx";
import PageHero from "../components/PageHero.jsx";
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
    const lockedLesson = lessons.find((lesson) => lesson.isLocked);
    return { ...level, lessons, completed, percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0, stars: lessons.reduce((sum, lesson) => sum + lesson.progress.bestStars, 0), isLocked: Boolean(lessons.length && lessons.every((lesson) => lesson.isLocked)), unlockRequirement: lockedLesson?.unlockRequirement };
  }), [language, state.lessons]);

  if (state.loading) return <PageLoader />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const basePath = language === "km" ? "khmer" : "english";
  const totalLessons = summaries.reduce((sum, level) => sum + level.lessons.length, 0);
  const totalCompleted = summaries.reduce((sum, level) => sum + level.completed, 0);
  return (
    <div>
      <PageHero
        badges={[
          { icon: LuBookOpen, label: `${totalCompleted}/${totalLessons} lessons complete` },
          { icon: LuStar, label: "Three stars per lesson" },
        ]}
        description={language === "km" ? "រៀនតាមលំដាប់។ ប្រឡងជាប់មេរៀននីមួយៗ ដើម្បីដោះសោមេរៀនបន្ទាប់ និងប្រមូលផ្កាយ។" : "Follow the path in order. Pass each lesson to unlock the next one and earn stars as your rhythm improves."}
        eyebrow="Learning path"
        icon={language === "km" ? LuLanguages : LuGraduationCap}
        title={languageLabel(language)}
        tone={language === "km" ? "violet" : "sky"}
      />
      <div className="snp-learning-grid mt-6">{summaries.map((level, index) => {
        const color = learningCardPalette[index % learningCardPalette.length];
        return (
          <LearningCategoryCard
            accent={color.accent}
            actionLabel="Open level"
            badge={level.isLocked ? "Locked" : `0${level.level}`}
            className={level.isLocked ? "snp-learning-card-locked" : ""}
            deep={color.deep}
            description={level.description}
            footer={level.isLocked ? <div className="snp-learning-card-locked-footer"><LuLockKeyhole /><span>Pass {level.unlockRequirement?.title || "the previous level"} first</span></div> : undefined}
            href={level.lessons.length && !level.isLocked ? `/${basePath}/level/${level.level}` : undefined}
            key={level.level}
            pattern={learningCardPatterns[index % learningCardPatterns.length]}
            subtitle={language === "km" ? `កម្រិតទី ${level.level}` : `Typing level ${level.level}`}
            title={level.title}
            visual={level.isLocked ? <LuLockKeyhole /> : <span>{level.icon}</span>}
          >
            <div className="snp-learning-card-progress"><ProgressBar color="bg-slate-900" value={level.percent} /></div>
            <div className="snp-learning-card-meta"><span><LuBookOpen />{level.completed}/{level.lessons.length} lessons</span><span><LuStar fill="currentColor" />{level.stars} stars</span></div>
          </LearningCategoryCard>
        );
      })}</div>
    </div>
  );
}
