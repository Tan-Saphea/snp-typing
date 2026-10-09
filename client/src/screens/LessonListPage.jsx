import { useCallback, useEffect, useState } from "react";
import { Breadcrumb, Button, Card, Progress, Tag } from "antd";
import {
  LuArrowLeft,
  LuBookOpen,
  LuCircleCheckBig,
  LuLockKeyhole,
  LuStar,
} from "react-icons/lu";

import { EmptyState, PageError, PageLoader } from "../components/AsyncState.jsx";
import LearningCategoryCard, {
  learningCardPalette,
  learningCardPatterns,
} from "../components/LearningCategoryCard.jsx";
import { Link, useParams } from "../components/NextRouter.jsx";
import PageHero from "../components/PageHero.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import Stars from "../components/Stars.jsx";
import { getLevel, isCurriculumLesson, languageLabel } from "../data/curriculum.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";
import { useAuthStore } from "../stores/authStore.js";

export default function LessonListPage({ language }) {
  const user = useAuthStore((state) => state.user);
  const isSuperGuest = Boolean(user?.preferences?.superGuest);
  const { level: levelParam } = useParams();
  const levelNumber = Number(levelParam);
  const level = getLevel(language, levelNumber);
  const [state, setState] = useState({ loading: true, lessons: [], error: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setState({
        loading: false,
        lessons: (await listLessons({ language, level: levelNumber })).filter(isCurriculumLesson),
        error: "",
      });
    } catch (error) {
      setState({ loading: false, lessons: [], error: getApiErrorMessage(error) });
    }
  }, [language, levelNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.loading) return <PageLoader />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;
  if (!level || !state.lessons.length) {
    return (
      <EmptyState
        title="Lessons are being prepared"
        message="This level is part of the curriculum and will be available soon."
      />
    );
  }

  const completed = state.lessons.filter((lesson) => lesson.progress.passed).length;
  const backPath = language === "km" ? "/khmer" : "/english";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#52c41a] hover:underline"
        >
          <LuArrowLeft size={16} />
          <span>Back to {languageLabel(language)} Levels</span>
        </Link>
      </div>

      <PageHero
        badges={[
          { icon: LuBookOpen, label: `${state.lessons.length} lessons` },
          { icon: LuStar, label: `${state.lessons.length * 3} stars available` },
        ]}
        description={level.description}
        eyebrow={`Level ${level.level}`}
        icon={LuBookOpen}
        title={level.title}
        tone={language === "km" ? "violet" : "sky"}
        actions={
          <div className="w-full sm:w-64 rounded-2xl bg-white/15 p-4 backdrop-blur-md border border-white/20 text-white">
            <ProgressBar
              strokeColor="#52c41a"
              railColor="rgba(255,255,255,0.2)"
              label={`${completed}/${state.lessons.length} completed`}
              value={(completed / state.lessons.length) * 100}
            />
            <p className="m-0 mt-2 text-right text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              70% accuracy to pass
            </p>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {state.lessons.map((lesson, index) => {
          const color = learningCardPalette[index % learningCardPalette.length];
          const lessonLocked = isSuperGuest ? false : lesson.isLocked;
          return (
            <LearningCategoryCard
              accent={color.accent}
              actionLabel={lesson.progress.passed ? "Practice Again" : "Start Lesson"}
              badge={
                lessonLocked
                  ? "Locked"
                  : lesson.progress.passed
                  ? "Passed ✓"
                  : `Lesson ${lesson.order}`
              }
              className={lessonLocked ? "opacity-75" : ""}
              deep={color.deep}
              description={lesson.instructions}
              footer={
                lessonLocked ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 py-2">
                    <LuLockKeyhole size={14} />
                    <span>Pass {lesson.unlockRequirement?.title || "previous lesson"} first</span>
                  </div>
                ) : undefined
              }
              href={lessonLocked ? undefined : `/lessons/${lesson.id}`}
              key={lesson.id}
              pattern={learningCardPatterns[index % learningCardPatterns.length]}
              subtitle={lesson.titleKhmer || `${languageLabel(language)} · ${lesson.difficulty}`}
              title={`Lesson ${lesson.order}: ${lesson.title}`}
              visual={
                lessonLocked ? (
                  <LuLockKeyhole size={36} />
                ) : lesson.progress.passed ? (
                  <LuCircleCheckBig size={36} className="text-emerald-300" />
                ) : (
                  <span>{lesson.order}</span>
                )
              }
            >
              <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                <Stars count={lesson.progress.bestStars} size={14} />
                <span>{lesson.progress.attempts} attempts</span>
              </div>
            </LearningCategoryCard>
          );
        })}
      </div>
    </div>
  );
}
