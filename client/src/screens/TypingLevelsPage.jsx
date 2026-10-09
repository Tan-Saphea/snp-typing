import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Col, Row, Tag } from "antd";
import { LuBookOpen, LuGraduationCap, LuLanguages, LuLockKeyhole, LuStar } from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import LearningCategoryCard, {
  learningCardPalette,
  learningCardPatterns,
} from "../components/LearningCategoryCard.jsx";
import PageHero from "../components/PageHero.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { curriculumLevels, isCurriculumLesson, languageLabel } from "../data/curriculum.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";
import { useAuthStore } from "../stores/authStore.js";

export default function TypingLevelsPage({ language }) {
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState({ loading: true, lessons: [], error: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setState({ loading: false, lessons: await listLessons({ language }), error: "" });
    } catch (error) {
      setState({ loading: false, lessons: [], error: getApiErrorMessage(error) });
    }
  }, [language]);

  useEffect(() => {
    void load();
  }, [load]);

  const summaries = useMemo(
    () => {
      const isSuperGuest = Boolean(user?.preferences?.superGuest);
      return curriculumLevels[language].map((level) => {
        const lessons = state.lessons.filter(
          (lesson) => lesson.level === level.level && isCurriculumLesson(lesson)
        );
        const completed = lessons.filter((lesson) => lesson.progress.passed).length;
        const lockedLesson = lessons.find((lesson) => lesson.isLocked);
        return {
          ...level,
          lessons,
          completed,
          percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
          stars: lessons.reduce((sum, lesson) => sum + lesson.progress.bestStars, 0),
          isLocked: isSuperGuest ? false : Boolean(lessons.length && lessons.every((lesson) => lesson.isLocked)),
          unlockRequirement: lockedLesson?.unlockRequirement,
        };
      });
    },
    [language, state.lessons, user?.preferences?.superGuest]
  );

  if (state.loading) return <PageLoader />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const basePath = language === "km" ? "khmer" : "english";
  const totalLessons = summaries.reduce((sum, level) => sum + level.lessons.length, 0);
  const totalCompleted = summaries.reduce((sum, level) => sum + level.completed, 0);

  return (
    <div className="space-y-8">
      <PageHero
        badges={[
          { icon: LuBookOpen, label: `${totalCompleted}/${totalLessons} lessons completed` },
          { icon: LuStar, label: "Earn up to 3 stars per lesson" },
        ]}
        description={
          language === "km"
            ? "រៀនតាមលំដាប់លំដោយ។ ប្រឡងជាប់មេរៀននីមួយៗ ដើម្បីដោះសោមេរៀនបន្ទាប់ និងប្រមូលផ្កាយ។"
            : "Follow the structured curriculum in sequence. Pass each lesson to unlock the next level and build flawless finger muscle memory."
        }
        eyebrow="Learning Path"
        icon={language === "km" ? LuLanguages : LuGraduationCap}
        title={languageLabel(language)}
        tone={language === "km" ? "violet" : "sky"}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {summaries.map((level, index) => {
          const color = learningCardPalette[index % learningCardPalette.length];
          return (
            <LearningCategoryCard
              accent={color.accent}
              actionLabel="Open Level"
              badge={level.isLocked ? "Locked" : `0${level.level}`}
              className={level.isLocked ? "opacity-75" : ""}
              deep={color.deep}
              description={level.description}
              footer={
                level.isLocked ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 py-2">
                    <LuLockKeyhole size={14} />
                    <span>Pass {level.unlockRequirement?.title || "previous level"} first</span>
                  </div>
                ) : undefined
              }
              href={
                level.lessons.length && !level.isLocked
                  ? `/${basePath}/level/${level.level}`
                  : undefined
              }
              key={level.level}
              pattern={learningCardPatterns[index % learningCardPatterns.length]}
              subtitle={language === "km" ? `កម្រិតទី ${level.level}` : `Typing Level ${level.level}`}
              title={level.title}
              visual={level.isLocked ? <LuLockKeyhole size={36} /> : <span>{level.icon}</span>}
            >
              <div className="mt-2">
                <ProgressBar
                  strokeColor={color.accent}
                  label={`${level.completed}/${level.lessons.length} lessons`}
                  value={level.percent}
                />
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-[#fa8c16]">
                    <LuStar fill="currentColor" size={13} />
                    <span>{level.stars} stars</span>
                  </span>
                </div>
              </div>
            </LearningCategoryCard>
          );
        })}
      </div>
    </div>
  );
}
