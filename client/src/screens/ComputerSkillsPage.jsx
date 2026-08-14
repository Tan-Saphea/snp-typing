import { useEffect, useState } from "react";
import { LuAlignLeft, LuClipboard, LuFileCheck2, LuHighlighter, LuImage, LuList, LuLockKeyhole, LuMonitor, LuMousePointer2, LuPalette, LuSave, LuShapes, LuType } from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import LearningCategoryCard, { learningCardPalette, learningCardPatterns } from "../components/LearningCategoryCard.jsx";
import PageHero from "../components/PageHero.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

function skillIcon(title) {
  if (/copy|paste|cut|undo|redo/i.test(title)) return LuClipboard;
  if (/color/i.test(title)) return LuPalette;
  if (/highlight/i.test(title)) return LuHighlighter;
  if (/alignment/i.test(title)) return LuAlignLeft;
  if (/bullets|numbering/i.test(title)) return LuList;
  if (/picture/i.test(title)) return LuImage;
  if (/shape/i.test(title)) return LuShapes;
  if (/review|challenge/i.test(title)) return LuFileCheck2;
  return LuType;
}

export default function ComputerSkillsPage() {
  const [state, setState] = useState({ loading: true, lessons: [], error: "" });
  useEffect(() => { listLessons({ type: "computer-skill" }).then((lessons) => setState({ loading: false, lessons, error: "" })).catch((error) => setState({ loading: false, lessons: [], error: getApiErrorMessage(error) })); }, []);
  if (state.loading) return <PageLoader />;
  if (state.error) return <PageError message={state.error} />;
  return (
    <div className="space-y-6">
      <PageHero
        badges={[
          { icon: LuMousePointer2, label: "Safe simulation" },
          { icon: LuSave, label: "Progress saved" },
        ]}
        description="Practice typing, editing, and document formatting in a safe workspace inspired by familiar word-processing tools."
        eyebrow="Digital foundations"
        icon={LuMonitor}
        title="Computer Skills Lab"
        tone="emerald"
      />
      
      <div>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.15em] text-primary-600">Skill library</p><h2 className="mt-1 text-2xl font-black">Build Word skills in order</h2></div><p className="max-w-md text-sm font-semibold leading-6 text-slate-500">Pass each activity to unlock the next one. Follow the requirements, format the document, and save your score.</p></div>
        <div className="snp-learning-grid">
        {state.lessons.map((lesson, index) => {
          const color = learningCardPalette[index % learningCardPalette.length];
          const Icon = skillIcon(lesson.title);
          return (
            <LearningCategoryCard
              accent={color.accent}
              actionLabel={lesson.progress.passed ? "Practice again" : "Open skill"}
              badge={lesson.isLocked ? "Locked" : lesson.progress.passed ? "✓" : String(index + 1).padStart(2, "0")}
              className={`snp-learning-card-compact ${lesson.isLocked ? "snp-learning-card-locked" : ""}`}
              deep={color.deep}
              description={lesson.instructions}
              footer={lesson.isLocked ? <div className="snp-learning-card-locked-footer"><LuLockKeyhole /><span>Pass {lesson.unlockRequirement?.title || "the previous skill"} first</span></div> : undefined}
              href={lesson.isLocked ? undefined : `/computer-skills/${lesson.id}`}
              key={lesson.id}
              pattern={learningCardPatterns[index % learningCardPatterns.length]}
              subtitle={`Microsoft Word · Level ${lesson.level}`}
              title={lesson.title}
              visual={lesson.isLocked ? <LuLockKeyhole /> : <Icon />}
            >
              <div className="snp-learning-card-meta"><span>{lesson.progress.attempts} attempts</span><span>{lesson.progress.bestStars}/3 stars</span></div>
            </LearningCategoryCard>
          );
        })}
        </div>
      </div>
    </div>
  );
}
