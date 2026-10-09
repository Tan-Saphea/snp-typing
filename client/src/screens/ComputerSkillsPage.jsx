import { useEffect, useState } from "react";
import { Segmented, Tag } from "antd";
import {
  LuAlignLeft,
  LuBookOpen,
  LuClipboard,
  LuCpu,
  LuFileCheck2,
  LuFileDown,
  LuFileText,
  LuGamepad2,
  LuHighlighter,
  LuImage,
  LuKeyboard,
  LuList,
  LuLockKeyhole,
  LuMonitor,
  LuPalette,
  LuShapes,
  LuType,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import DigitalLiteracyQuiz from "../components/DigitalLiteracyQuiz.jsx";
import HardwareExplorer from "../components/HardwareExplorer.jsx";
import InteractiveShortcutsArena from "../components/InteractiveShortcutsArena.jsx";
import KhmerUnicodeGuide from "../components/KhmerUnicodeGuide.jsx";
import LearningCategoryCard, {
  learningCardPalette,
  learningCardPatterns,
} from "../components/LearningCategoryCard.jsx";
import OfficeTemplatesHub from "../components/OfficeTemplatesHub.jsx";
import PageHero from "../components/PageHero.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";
import { useAuthStore } from "../stores/authStore.js";

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
  const user = useAuthStore((state) => state.user);
  const isSuperGuest = Boolean(user?.preferences?.superGuest);

  const [activeTab, setActiveTab] = useState("word-skills");
  const [state, setState] = useState({ loading: true, lessons: [], error: "" });

  useEffect(() => {
    listLessons({ type: "computer-skill" })
      .then((lessons) => setState({ loading: false, lessons, error: "" }))
      .catch((error) =>
        setState({ loading: false, lessons: [], error: getApiErrorMessage(error) })
      );
  }, []);

  const tabOptions = [
    {
      value: "word-skills",
      label: (
        <div className="flex items-center gap-2 px-3 py-1.5 font-bold text-xs sm:text-sm">
          <LuFileText size={18} className="text-emerald-500" />
          <span>Word Skills (20 មេរៀន)</span>
        </div>
      ),
    },
    {
      value: "quiz-game",
      label: (
        <div className="flex items-center gap-2 px-3 py-1.5 font-bold text-xs sm:text-sm">
          <LuGamepad2 size={18} className="text-[#52c41a]" />
          <span>Digital Quiz (ល្បែងសំណួរ)</span>
        </div>
      ),
    },
    {
      value: "shortcuts-arena",
      label: (
        <div className="flex items-center gap-2 px-3 py-1.5 font-bold text-xs sm:text-sm">
          <LuKeyboard size={18} className="text-orange-500" />
          <span>Shortcuts Arena (ហាត់ផ្លូវកាត់)</span>
          <Tag color="orange" className="ml-1 text-[10px] font-extrabold rounded-full border-0 uppercase">
            Hot
          </Tag>
        </div>
      ),
    },
    {
      value: "hardware-explorer",
      label: (
        <div className="flex items-center gap-2 px-3 py-1.5 font-bold text-xs sm:text-sm">
          <LuCpu size={18} className="text-blue-500" />
          <span>Hardware Explorer (ស្គាល់គ្រឿងកុំព្យូទ័រ)</span>
        </div>
      ),
    },
    {
      value: "office-templates",
      label: (
        <div className="flex items-center gap-2 px-3 py-1.5 font-bold text-xs sm:text-sm">
          <LuFileDown size={18} className="text-cyan-600 dark:text-cyan-400" />
          <span>Office Templates (គំរូឯកសារ)</span>
        </div>
      ),
    },
    {
      value: "khmer-unicode",
      label: (
        <div className="flex items-center gap-2 px-3 py-1.5 font-bold text-xs sm:text-sm">
          <LuBookOpen size={18} className="text-purple-500" />
          <span>Khmer Unicode (ក្បួនវាយអក្សរខ្មែរ)</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHero
        badges={[
          { icon: LuFileText, label: "20 Word Skills Lessons" },
          { icon: LuGamepad2, label: "240+ Digital Quiz Questions" },
          { icon: LuKeyboard, label: "Real-Time Shortcuts Arena" },
          { icon: LuCpu, label: "Visual Hardware Explorer" },
          { icon: LuFileDown, label: "Official Document Templates" },
          { icon: LuBookOpen, label: "Khmer Unicode & Typing Rules" },
        ]}
        description="Master digital literacy foundations, practice formatting in simulated Microsoft Word activities, test computer knowledge, drill muscle-memory shortcuts, and explore interactive computer hardware parts and Khmer Unicode rules."
        eyebrow="Digital Competency Lab"
        icon={LuMonitor}
        title="Computer Skills Lab"
        tone="emerald"
      />

      {/* Modern Ant Design Segmented Tabs */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <Segmented
          size="large"
          value={activeTab}
          onChange={setActiveTab}
          options={tabOptions}
          className="bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
        />
      </div>

      {/* TAB 1: WORD SKILLS PRACTICE LESSONS */}
      {activeTab === "word-skills" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Curriculum Library · កម្មវិធីសិក្សា
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                Build Word Skills in Order (២០ មេរៀនអនុវត្ត)
              </h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-slate-500">
              Pass each activity to unlock the next one. Follow the requirements, format the document, and save your score.
            </p>
          </div>

          {state.loading && <PageLoader message="Loading Word Skills lessons…" />}
          {state.error && <PageError message={state.error} />}

          {!state.loading && !state.error && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {state.lessons.map((lesson, index) => {
                const color = learningCardPalette[index % learningCardPalette.length];
                const Icon = skillIcon(lesson.title);
                const isLocked = isSuperGuest ? false : lesson.isLocked;
                return (
                  <LearningCategoryCard
                    accent={color.accent}
                    actionLabel={lesson.progress?.passed ? "Practice again" : "Open skill"}
                    badge={isLocked ? "Locked" : lesson.progress?.passed ? "Pass" : String(index + 1).padStart(2, "0")}
                    className={isLocked ? "opacity-75" : ""}
                    deep={color.deep}
                    description={lesson.instructions}
                    footer={
                      isLocked ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 py-2">
                          <LuLockKeyhole size={14} />
                          <span>Pass {lesson.unlockRequirement?.title || "previous skill"} first</span>
                        </div>
                      ) : undefined
                    }
                    href={isLocked ? undefined : `/computer-skills/${lesson.id}`}
                    key={lesson.id}
                    pattern={learningCardPatterns[index % learningCardPatterns.length]}
                    subtitle={`Microsoft Word · Level ${lesson.level}`}
                    title={lesson.title}
                    visual={isLocked ? <LuLockKeyhole size={24} /> : <Icon size={24} />}
                  >
                    <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{lesson.progress?.attempts ?? 0} attempts</span>
                      <span>{lesson.progress?.bestStars ?? 0}/3 stars</span>
                    </div>
                  </LearningCategoryCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIGITAL LITERACY QUIZ GAME */}
      {activeTab === "quiz-game" && (
        <div>
          <DigitalLiteracyQuiz />
        </div>
      )}

      {/* TAB 3: INTERACTIVE SHORTCUTS ARENA */}
      {activeTab === "shortcuts-arena" && (
        <div>
          <InteractiveShortcutsArena />
        </div>
      )}

      {/* TAB 4: VISUAL HARDWARE EXPLORER */}
      {activeTab === "hardware-explorer" && (
        <div>
          <HardwareExplorer />
        </div>
      )}

      {/* TAB 5: KHMER OFFICE TEMPLATES HUB */}
      {activeTab === "office-templates" && (
        <div>
          <OfficeTemplatesHub />
        </div>
      )}

      {/* TAB 6: KHMER UNICODE & TYPING RULES */}
      {activeTab === "khmer-unicode" && (
        <div>
          <KhmerUnicodeGuide />
        </div>
      )}
    </div>
  );
}
