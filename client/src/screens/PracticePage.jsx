import { useEffect, useMemo, useState } from "react";
import { segmentGraphemes } from "@snp/shared";
import {
  App,
  Button,
  Card,
  Dropdown,
  Input,
  Modal,
  Segmented,
  Select,
  Tag,
  Tooltip,
} from "antd";
import {
  LuArrowRight,
  LuBookOpen,
  LuBot,
  LuCheck,
  LuClock,
  LuCopy,
  LuFileText,
  LuFlame,
  LuKeyboard,
  LuLanguages,
  LuMonitor,
  LuPlay,
  LuRotateCcw,
  LuSearch,
  LuSlidersHorizontal,
  LuSparkles,
  LuStar,
  LuTarget,
  LuTrash2,
  LuTrendingUp,
  LuTv,
  LuType,
  LuZap,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import LearningCategoryCard, {
  learningCardPalette,
  learningCardPatterns,
} from "../components/LearningCategoryCard.jsx";
import PageHero from "../components/PageHero.jsx";
import StandaloneTypingRunner from "../features/typing/StandaloneTypingRunner.jsx";
import { buildTargetText } from "../features/typing/typingContent.js";
import { practicePresets } from "../data/practicePresets.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

const { TextArea } = Input;

const modes = [
  {
    key: "all",
    icon: LuSparkles,
    label: { en: "All Themes", km: "ប្រធានបទទាំងអស់" },
    note: { en: "Explore all practice topics", km: "រុករកគ្រប់ប្រធានបទហាត់ទាំងអស់" },
  },
  {
    key: "word",
    icon: LuType,
    label: { en: "Word Vocabulary", km: "វាក្យសព្ទពាក្យ" },
    note: { en: "Warm up with short words", km: "ហាត់ជាមួយពាក្យខ្លីៗ" },
  },
  {
    key: "sentence",
    icon: LuBookOpen,
    label: { en: "Sentence Rhythm", km: "ចង្វាក់ប្រយោគ" },
    note: { en: "Smooth daily sentences", km: "ប្រយោគជីវិតប្រចាំថ្ងៃ" },
  },
  {
    key: "paragraph",
    icon: LuFileText,
    label: { en: "Stories & Paragraphs", km: "អត្ថបទ និងកថាខណ្ឌ" },
    note: { en: "Paragraphs and stories", km: "អត្ថបទ និងកថាខណ្ឌ" },
  },
  {
    key: "symbols",
    icon: LuKeyboard,
    label: { en: "Numbers & Signs", km: "លេខ និងសញ្ញា" },
    note: { en: "Numbers & shift symbols", km: "លេខ និងសញ្ញាពិសេស" },
  },
  {
    key: "custom",
    icon: LuSlidersHorizontal,
    label: { en: "Custom Text", km: "អត្ថបទផ្ទាល់ខ្លួន" },
    note: { en: "Paste your own text", km: "បិទភ្ជាប់អត្ថបទផ្ទាល់ខ្លួន" },
  },
];

const durationOptions = [
  { value: 0, label: { en: "No Limit (Full Text)", km: "មិនកំណត់ពេល (អត្ថបទពេញ)" } },
  { value: 60, label: { en: "1 Minute Sprint (60s)", km: "១ នាទី (៦០ វិនាទី)" } },
  { value: 120, label: { en: "2 Minutes (120s)", km: "២ នាទី (១២០ វិនាទី)" } },
  { value: 180, label: { en: "3 Minutes (180s)", km: "៣ នាទី (១៨០ វិនាទី)" } },
];

const accuracyTargets = [
  { value: 70, label: "70% (Standard / ស្តង់ដារ)" },
  { value: 85, label: "85% (Proficient / ពូកែ)" },
  { value: 95, label: "95% (Mastery / ល្អឥតខ្ចោះ)" },
];

const pageCopy = {
  en: {
    eyebrow: "Practice Missions & Skill Drills",
    heading: "Free Practice Playground",
    intro: "Choose words, sentences, stories, or your own magic custom text to practice typing freely anytime.",
    allCategories: "All Categories",
    chooseLanguage: "Keyboard Language",
    english: "English QWERTY",
    khmer: "Khmer NIDA",
    preview: "Mission Setup & Preview",
    goal: "Accuracy Target",
    duration: "Time Limit",
    units: "Typing Units",
    reward: "3 Stars available",
    start: "Start Practice",
    practiceAgain: "Practice Again",
    openSkill: "Start Practice",
    customLabel: "Magic Custom Text (អត្ថបទផ្ទាល់ខ្លួន)",
    customPlaceholder: "Type or paste your own custom text here (e.g. homework, article, story)…",
    customHelper: "Paste articles, homework paragraphs, or quotes to practice typing freely.",
    loadSample: "Load Sample Text",
    clear: "Clear Text",
    searchPlaceholder: "Search practice topics (words, stories, proverbs...)",
  },
  km: {
    eyebrow: "បេសកកម្មហាត់វាយអក្សរ & សង្វៀនហ្វឹកហាត់",
    heading: "ទីលានហាត់វាយអក្សរដោយសេរី",
    intro: "ជ្រើសរើសពាក្យ ប្រយោគ អត្ថបទ ឬបិទភ្ជាប់អត្ថបទផ្ទាល់ខ្លួន ដើម្បីហាត់សមត្ថភាពវាយអក្សរគ្រប់ពេលវេលា។",
    allCategories: "ប្រធានបទទាំងអស់",
    chooseLanguage: "ជ្រើសរើសក្ដារចុច",
    english: "អង់គ្លេស QWERTY",
    khmer: "ខ្មែរ NIDA",
    preview: "រៀបចំបេសកកម្ម & មើលអត្ថបទ",
    goal: "គោលដៅភាពត្រឹមត្រូវ",
    duration: "ថិរវេលាកំណត់",
    units: "ចំនួនតួអក្សរ",
    reward: "ផ្កាយរង្វាន់ ៣",
    start: "ចាប់ផ្ដើមបេសកកម្ម",
    practiceAgain: "ហាត់ម្ដងទៀត",
    openSkill: "ចាប់ផ្ដើមហាត់",
    customLabel: "អត្ថបទផ្ទាល់ខ្លួនរបស់អ្នក (Magic Custom Text)",
    customPlaceholder: "សរសេរ ឬបិទភ្ជាប់អត្ថបទនៅទីនេះ (ដូចជាកិច្ចការសាលា មេរៀន ឬព័ត៌មាន)...",
    customHelper: "អ្នកអាចបិទភ្ជាប់កថាខណ្ឌ កិច្ចការសាលា ឬសុភាសិតដើម្បីហាត់បានដោយសេរី។",
    loadSample: "បញ្ចូលអត្ថបទគំរូ",
    clear: "សម្អាតអត្ថបទ",
    searchPlaceholder: "ស្វែងរកប្រធានបទហាត់ (ពាក្យ, ប្រយោគ, សុភាសិត, អង្គរវត្ត...)",
  },
};

// Helper to pick a Lucide icon matching the screenshot aesthetic
function getPresetVisualIcon(preset, index) {
  const iconProps = { className: "text-5xl text-white drop-shadow-md" };
  const idx = index % 8;
  switch (idx) {
    case 0:
      return <LuMonitor {...iconProps} />;
    case 1:
      return <LuSparkles {...iconProps} />;
    case 2:
      return <LuKeyboard {...iconProps} />;
    case 3:
      return <LuSparkles {...iconProps} />;
    case 4:
      return <LuFileText {...iconProps} />;
    case 5:
      return <LuTrendingUp {...iconProps} />;
    case 6:
      return <LuTv {...iconProps} />;
    case 7:
      return <LuBot {...iconProps} />;
    default:
      return <LuSparkles {...iconProps} />;
  }
}

export default function PracticePage() {
  const { message } = App.useApp();
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("km");
  const [mode, setMode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customText, setCustomText] = useState("");
  const [duration, setDuration] = useState(0);
  const [targetAccuracy, setTargetAccuracy] = useState(70);
  const [session, setSession] = useState(null);
  const [savedProgress, setSavedProgress] = useState({});

  // Load lessons & saved progress from localStorage
  useEffect(() => {
    listLessons({ category: "practice-templates" })
      .then(setLessons)
      .catch((value) => setError(getApiErrorMessage(value)))
      .finally(() => setLoading(false));

    try {
      const saved = localStorage.getItem("snp_practice_progress");
      if (saved) setSavedProgress(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const availablePresets = useMemo(() => {
    let list = practicePresets[language] || [];
    if (mode !== "all" && mode !== "custom") {
      list = list.filter((item) => item.mode === mode);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.text.toLowerCase().includes(q)
      );
    }
    return list;
  }, [language, mode, searchQuery]);

  const template = useMemo(() => {
    return (
      lessons.find(
        (item) =>
          item.language === language &&
          item.title.toLowerCase().includes(mode === "custom" ? "custom" : "word")
      ) || lessons[0]
    );
  }, [language, lessons, mode]);

  const words = pageCopy[language];

  // Start practice with selected preset or custom text
  function handleLaunchPractice(presetToUse = selectedPreset) {
    const text = presetToUse ? presetToUse.text : customText.trim();
    if (!text) {
      message.warning("សូមបញ្ចូលអត្ថបទជាមុនសិន! (Please provide text)");
      return;
    }

    const practiceLesson = {
      ...template,
      title: presetToUse ? presetToUse.title : "Magic Custom Text",
      titleKhmer: presetToUse ? presetToUse.title : "អត្ថបទផ្ទាល់ខ្លួន",
      minimumAccuracy: targetAccuracy,
    };

    // Record attempt in savedProgress
    if (presetToUse) {
      const current = savedProgress[presetToUse.id] || { attempts: 0, bestStars: 0 };
      const updated = {
        ...savedProgress,
        [presetToUse.id]: {
          ...current,
          attempts: current.attempts + 1,
          bestStars: Math.max(current.bestStars, 1),
        },
      };
      setSavedProgress(updated);
      try {
        localStorage.setItem("snp_practice_progress", JSON.stringify(updated));
      } catch (e) {}
    }

    setSelectedPreset(null);
    setSession({ lesson: practiceLesson, text, duration });
  }

  function handleLoadSamplePreset(sample) {
    setCustomText(sample.text);
    message.success(`បានបញ្ចូល "${sample.title}"`);
  }

  if (loading) return <PageLoader />;
  if (error) return <PageError message={error} />;

  if (session) {
    return (
      <StandaloneTypingRunner
        lesson={session.lesson}
        targetText={session.text}
        duration={session.duration}
        mode="practice"
        onExit={() => setSession(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER */}
      <PageHero
        badges={[
          { icon: LuTarget, label: "Unlimited Free Practice" },
          { icon: LuFlame, label: "Customizable Missions" },
          { icon: LuStar, label: "Earn Stars & Record Results" },
        ]}
        description={words.intro}
        eyebrow={words.eyebrow}
        icon={LuSparkles}
        title={words.heading}
        tone="amber"
      />

      {/* 2. MODERN CONTROLS TOOLBAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Left: Language Segmented */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Segmented
            size="large"
            value={language}
            onChange={setLanguage}
            className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl font-bold"
            options={[
              {
                value: "km",
                label: (
                  <div className="flex items-center gap-1.5 px-3 py-1 font-bold text-xs sm:text-sm">
                    <span>🇰🇭</span>
                    <span>{words.khmer}</span>
                  </div>
                ),
              },
              {
                value: "en",
                label: (
                  <div className="flex items-center gap-1.5 px-3 py-1 font-bold text-xs sm:text-sm">
                    <span>🇬🇧</span>
                    <span>{words.english}</span>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Center: Search box */}
        <div className="flex-1 max-w-md">
          <Input
            size="large"
            prefix={<LuSearch className="text-slate-400 mr-1" />}
            placeholder={words.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className="rounded-2xl font-medium"
          />
        </div>
      </div>

      {/* 3. CATEGORY / THEME TABS */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <Segmented
          size="large"
          value={mode}
          onChange={setMode}
          className="bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
          options={modes.map((m) => {
            const Icon = m.icon;
            return {
              value: m.key,
              label: (
                <div className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs sm:text-sm">
                  <Icon size={14} className="shrink-0" />
                  <span>{m.label[language]}</span>
                </div>
              ),
            };
          })}
        />
      </div>

      {/* 4. MAIN CONTENT AREA */}
      {mode === "custom" ? (
        /* CUSTOM TEXT WORKSPACE */
        <Card
          variant="outlined"
          className="rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden"
          styles={{ body: { padding: "24px sm:32px" } }}
        >
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-xl">
                  <LuSlidersHorizontal size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white m-0">
                    {words.customLabel}
                  </h3>
                  <p className="text-xs text-slate-500 m-0 mt-0.5">
                    {words.customHelper}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Dropdown
                  menu={{
                    items: (practicePresets[language] || []).map((preset) => ({
                      key: preset.id,
                      label: `${preset.icon} ${preset.title}`,
                      onClick: () => handleLoadSamplePreset(preset),
                    })),
                  }}
                >
                  <Button size="middle" icon={<LuCopy size={14} />} className="font-bold rounded-xl">
                    {words.loadSample}
                  </Button>
                </Dropdown>
                {customText && (
                  <Button
                    size="middle"
                    danger
                    icon={<LuTrash2 size={14} />}
                    onClick={() => setCustomText("")}
                    className="font-bold rounded-xl"
                  >
                    {words.clear}
                  </Button>
                )}
              </div>
            </div>

            {/* Text input area */}
            <TextArea
              rows={7}
              maxLength={4000}
              showCount
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={words.customPlaceholder}
              className="text-base font-medium rounded-2xl leading-relaxed p-4"
            />

            {/* Quick mission settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <LuClock className="text-sky-500" />
                  <span>{words.duration}</span>
                </label>
                <Select
                  size="large"
                  value={duration}
                  onChange={setDuration}
                  className="w-full font-bold"
                  options={durationOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label[language],
                  }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <LuTarget className="text-[#52c41a]" />
                  <span>{words.goal}</span>
                </label>
                <Select
                  size="large"
                  value={targetAccuracy}
                  onChange={setTargetAccuracy}
                  className="w-full font-bold"
                  options={accuracyTargets}
                />
              </div>
            </div>

            {/* Start CTA */}
            <Button
              type="primary"
              size="large"
              disabled={!customText.trim()}
              onClick={() => handleLaunchPractice(null)}
              icon={<LuPlay size={18} />}
              className="w-full h-12 flex items-center justify-center gap-2 font-black text-base bg-[#52c41a] hover:!bg-[#46aa16] border-0 rounded-xl shadow-md"
            >
              <span>{words.start}</span>
              <LuArrowRight size={18} />
            </Button>
          </div>
        </Card>
      ) : (
        /* PRESETS GRID (Matching the screenshot aesthetic) */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {availablePresets.map((preset, index) => {
            const progress = savedProgress[preset.id];
            const stars = progress?.bestStars || 0;
            const attempts = progress?.attempts || (stars > 0 ? 1 : 0);
            const color = learningCardPalette[index % learningCardPalette.length];
            const visualIcon = getPresetVisualIcon(preset, index);

            const badgeText =
              stars > 0
                ? "PASSED ✓"
                : `PRACTICE 0${index + 1}`;

            const actionLabel = stars > 0 ? words.practiceAgain : words.openSkill;

            const footer = (
              <Button
                type="primary"
                onClick={() => setSelectedPreset(preset)}
                className="w-full h-10 flex items-center justify-center gap-2 font-bold text-sm bg-[#52c41a] hover:!bg-[#46aa16] border-0 rounded-xl shadow-sm hover:shadow transition-all"
              >
                <span>{actionLabel}</span>
                <LuArrowRight size={15} />
              </Button>
            );

            return (
              <LearningCategoryCard
                accent={color.accent}
                badge={badgeText}
                deep={color.deep}
                description={preset.description}
                footer={footer}
                key={preset.id}
                pattern={learningCardPatterns[index % learningCardPatterns.length]}
                subtitle={`FREE PRACTICE · LEVEL ${Math.floor(index / 2) + 1}`}
                title={preset.title}
                visual={visualIcon}
              >
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{attempts} attempts</span>
                  <span className="text-[#fa8c16] font-extrabold flex items-center gap-1">
                    <LuStar size={13} className={stars > 0 ? "fill-current" : "text-slate-300"} />
                    <span>{stars}/3 stars</span>
                  </span>
                </div>
              </LearningCategoryCard>
            );
          })}
        </div>
      )}

      {/* 5. MISSION SETUP & PREVIEW MODAL */}
      <Modal
        open={!!selectedPreset}
        onCancel={() => setSelectedPreset(null)}
        footer={null}
        width={680}
        centered
        className="rounded-3xl overflow-hidden"
        title={
          selectedPreset ? (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-3xl p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                {selectedPreset.icon}
              </span>
              <div>
                <div className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  {selectedPreset.title}
                </div>
                <div className="text-xs text-slate-400 font-semibold">
                  {selectedPreset.description}
                </div>
              </div>
            </div>
          ) : null
        }
      >
        {selectedPreset && (
          <div className="space-y-5 pt-3">
            {/* Text Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{words.preview}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {segmentGraphemes(selectedPreset.text, language === "km" ? "km" : "en").length}{" "}
                  {language === "km" ? "តួអក្សរ" : "units"}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed max-h-36 overflow-y-auto pr-1">
                {selectedPreset.text}
              </p>
            </div>

            {/* Mission Settings: Duration & Accuracy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <LuClock className="text-sky-500" />
                  <span>{words.duration}</span>
                </label>
                <Select
                  size="large"
                  value={duration}
                  onChange={setDuration}
                  className="w-full font-bold"
                  options={durationOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label[language],
                  }))}
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <LuTarget className="text-[#52c41a]" />
                  <span>{words.goal}</span>
                </label>
                <Select
                  size="large"
                  value={targetAccuracy}
                  onChange={setTargetAccuracy}
                  className="w-full font-bold"
                  options={accuracyTargets}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <Button
                size="large"
                onClick={() => setSelectedPreset(null)}
                className="flex-1 font-bold h-12 rounded-xl"
              >
                Cancel (បោះបង់)
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<LuPlay size={18} />}
                onClick={() => handleLaunchPractice(selectedPreset)}
                className="flex-2 font-black h-12 text-base bg-[#52c41a] hover:!bg-[#46aa16] border-0 rounded-xl shadow-md"
              >
                <span>{words.start}</span>
                <LuArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
