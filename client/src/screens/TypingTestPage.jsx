import { useEffect, useMemo, useState } from "react";
import { segmentGraphemes } from "@snp/shared";
import {
  App,
  Button,
  Card,
  Input,
  Modal,
  Progress,
  Segmented,
  Select,
  Tag,
  Tooltip,
} from "antd";
import {
  LuArrowRight,
  LuAward,
  LuBookOpen,
  LuBot,
  LuCheck,
  LuClock,
  LuFileText,
  LuFlame,
  LuGauge,
  LuInfo,
  LuKeyboard,
  LuLanguages,
  LuMonitor,
  LuPlay,
  LuRotateCcw,
  LuSearch,
  LuShieldCheck,
  LuSparkles,
  LuStar,
  LuTarget,
  LuTimer,
  LuTrendingUp,
  LuTrophy,
  LuTv,
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
import { getSpeedTier, speedTestTracks } from "../data/speedTestTracks.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

const durationsFilterOptions = [
  { value: "all", label: { en: "All Durations", km: "គ្រប់ថិរវេលា" } },
  { value: "30", label: { en: "30s Sprint", km: "៣០ វិនាទី" } },
  { value: "60", label: { en: "1 Min Official", km: "១ នាទី (ផ្លូវការ)" } },
  { value: "120", label: { en: "2 Min Rhythm", km: "២ នាទី" } },
  { value: "180", label: { en: "3 Min Endurance", km: "៣ នាទី" } },
  { value: "300", label: { en: "5 Min Master", km: "៥ នាទី (កំពូល)" } },
];

const accuracyTargets = [
  { value: 80, label: "80% (Standard / ស្តង់ដារ)" },
  { value: 85, label: "85% (Proficient / ពូកែ)" },
  { value: 90, label: "90% (Advanced / កម្រិតខ្ពស់)" },
  { value: 95, label: "95% (Mastery / ល្អឥតខ្ចោះ)" },
];

function getTrackVisualIcon(index) {
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
      return <LuGauge {...iconProps} />;
  }
}

export default function TypingTestPage() {
  const { message } = App.useApp();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("km");
  const [durationFilter, setDurationFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [testDuration, setTestDuration] = useState(60);
  const [targetAccuracy, setTargetAccuracy] = useState(85);
  const [session, setSession] = useState(null);
  const [savedRecords, setSavedRecords] = useState({});

  useEffect(() => {
    listLessons({ type: "test" })
      .then(setLessons)
      .catch((value) => setError(getApiErrorMessage(value)))
      .finally(() => setLoading(false));

    try {
      const records = localStorage.getItem("snp_speed_test_records");
      if (records) setSavedRecords(JSON.parse(records));
    } catch (e) {}
  }, []);

  const tracks = useMemo(() => {
    let list = speedTestTracks[language] || [];
    if (durationFilter !== "all") {
      list = list.filter((t) => String(t.duration) === durationFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.text.toLowerCase().includes(q)
      );
    }
    return list;
  }, [language, durationFilter, searchQuery]);

  const template = useMemo(
    () => lessons.find((item) => item.language === language) || lessons[0],
    [language, lessons]
  );

  // Calculate personal best stats across all tests
  const stats = useMemo(() => {
    const recordsArray = Object.values(savedRecords);
    if (!recordsArray.length) {
      return {
        bestSpeed: 0,
        averageAccuracy: 0,
        totalTests: 0,
        tier: getSpeedTier(0, language),
      };
    }
    const best = Math.max(...recordsArray.map((r) => r.bestSpeed || 0));
    const avgAcc =
      recordsArray.reduce((acc, curr) => acc + (curr.bestAccuracy || 0), 0) /
      recordsArray.length;
    const total = recordsArray.reduce((acc, curr) => acc + (curr.attempts || 0), 0);
    return {
      bestSpeed: best,
      averageAccuracy: Math.round(avgAcc) || 0,
      totalTests: total,
      tier: getSpeedTier(best, language),
    };
  }, [savedRecords, language]);

  function handleStartTest(trackToStart = selectedTrack) {
    if (!trackToStart) return;

    const baseText = trackToStart.text;
    const repeatedText = Array(15).fill(baseText).join(" ");

    const testLesson = {
      ...template,
      title: trackToStart.title,
      titleKhmer: trackToStart.title,
      minimumAccuracy: targetAccuracy,
    };

    // Update attempts record in local state
    const current = savedRecords[trackToStart.id] || {
      attempts: 0,
      bestSpeed: 0,
      bestAccuracy: 0,
      bestStars: 0,
    };
    const updated = {
      ...savedRecords,
      [trackToStart.id]: {
        ...current,
        attempts: current.attempts + 1,
        bestStars: Math.max(current.bestStars, 1),
      },
    };
    setSavedRecords(updated);
    try {
      localStorage.setItem("snp_speed_test_records", JSON.stringify(updated));
    } catch (e) {}

    setSelectedTrack(null);
    setSession({
      lesson: testLesson,
      text: repeatedText,
      duration: testDuration || trackToStart.duration,
    });
  }

  if (loading) return <PageLoader message="Preparing typing tests…" />;
  if (error) return <PageError message={error} />;

  if (session) {
    return (
      <StandaloneTypingRunner
        lesson={session.lesson}
        targetText={session.text}
        duration={session.duration}
        mode="test"
        onExit={() => setSession(null)}
      />
    );
  }

  const speedUnit = language === "km" ? "CPM" : "WPM";

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO BANNER */}
      <PageHero
        badges={[
          { icon: LuGauge, label: "Real-Time WPM & CPM Speed Calculation" },
          { icon: LuTrophy, label: "Official Tier Certification (Bronze → Diamond)" },
          { icon: LuShieldCheck, label: "Live Progress & Leaderboard Recording" },
        ]}
        description="Select your official assessment track and duration. The assessment clock starts on your first keypress and calculates your net speed, accuracy, and typist rank."
        eyebrow="Timed Speed Assessment & Certification"
        icon={LuTimer}
        title="Speed Assessment Test"
        tone="sky"
      />

      {/* 2. PERSONAL BEST & TYPIST RANK HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <LuZap size={14} className="text-[#52c41a]" />
            <span>ល្បឿនខ្ពស់បំផុត (Top Speed)</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#52c41a] mt-0.5">
            {stats.bestSpeed > 0 ? `${stats.bestSpeed} ${speedUnit}` : `0 ${speedUnit}`}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Net Speed Record</div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <LuTarget size={14} className="text-sky-500" />
            <span>ភាពត្រឹមត្រូវមធ្យម (Accuracy)</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {stats.averageAccuracy > 0 ? `${stats.averageAccuracy}%` : "100%"}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Overall Precision</div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <LuAward size={14} className="text-[#fa8c16]" />
            <span>កម្រិតជំនាញ (Typist Tier)</span>
          </div>
          <div className="text-base sm:text-lg font-black text-[#fa8c16] mt-0.5 truncate">
            {stats.tier.badge}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">{stats.tier.titleKhmer}</div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <LuClock size={14} className="text-purple-500" />
            <span>ចំនួនដងបានតេស្ត (Total Tests)</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {stats.totalTests} ដង
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Completed Sessions</div>
        </div>
      </div>

      {/* 3. CONTROLS TOOLBAR */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Language selector */}
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
                    <span>ខ្មែរ NIDA</span>
                  </div>
                ),
              },
              {
                value: "en",
                label: (
                  <div className="flex items-center gap-1.5 px-3 py-1 font-bold text-xs sm:text-sm">
                    <span>🇬🇧</span>
                    <span>English QWERTY</span>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <Input
            size="large"
            prefix={<LuSearch className="text-slate-400 mr-1" />}
            placeholder="ស្វែងរកវិញ្ញាសាតេស្តល្បឿន (Sprint, Official, Literature, Admin...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className="rounded-2xl font-medium"
          />
        </div>
      </div>

      {/* 4. DURATION FILTER TABS */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <Segmented
          size="large"
          value={durationFilter}
          onChange={setDurationFilter}
          className="bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
          options={durationsFilterOptions.map((opt) => ({
            value: opt.value,
            label: (
              <div className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs sm:text-sm">
                <LuClock size={15} className="text-sky-500" />
                <span>{opt.label[language]}</span>
              </div>
            ),
          }))}
        />
      </div>

      {/* 5. ASSESSMENT TRACKS GRID (LearningCategoryCard style matching screenshot) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tracks.map((track, index) => {
          const record = savedRecords[track.id];
          const stars = record?.bestStars || 0;
          const attempts = record?.attempts || 0;
          const color = learningCardPalette[index % learningCardPalette.length];
          const visualIcon = getTrackVisualIcon(index);

          const badgeText =
            stars > 0 ? "PASSED ✓" : track.badge || `SPEED 0${index + 1}`;

          const actionLabel = stars > 0 ? "Retake Test" : "Start Test";

          const footer = (
            <Button
              type="primary"
              onClick={() => {
                setSelectedTrack(track);
                setTestDuration(track.duration);
                setTargetAccuracy(track.targetAccuracy || 85);
              }}
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
              description={track.description}
              footer={footer}
              key={track.id}
              pattern={learningCardPatterns[index % learningCardPatterns.length]}
              subtitle={`SPEED ASSESSMENT · ${track.duration}S · ${track.difficulty}`}
              title={track.title}
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

      {/* 6. ASSESSMENT TEST SETUP & PREVIEW MODAL */}
      <Modal
        open={!!selectedTrack}
        onCancel={() => setSelectedTrack(null)}
        footer={null}
        width={680}
        centered
        className="rounded-3xl overflow-hidden"
        title={
          selectedTrack ? (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-3xl p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                ⏱️
              </span>
              <div>
                <div className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  {selectedTrack.title}
                </div>
                <div className="text-xs text-slate-400 font-semibold">
                  {selectedTrack.description} • <Tag color="blue">{selectedTrack.badge}</Tag>
                </div>
              </div>
            </div>
          ) : null
        }
      >
        {selectedTrack && (
          <div className="space-y-5 pt-3">
            {/* Passage Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>អត្ថបទវិញ្ញាសាប្រឡង (Test Passage Preview)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {segmentGraphemes(selectedTrack.text, language === "km" ? "km" : "en").length}{" "}
                  {language === "km" ? "តួអក្សរ" : "units"}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed max-h-36 overflow-y-auto pr-1">
                {selectedTrack.text}
              </p>
            </div>

            {/* Test Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <LuClock className="text-sky-500" />
                  <span>ថិរវេលាតេស្ត (Timer Duration)</span>
                </label>
                <Select
                  size="large"
                  value={testDuration}
                  onChange={setTestDuration}
                  className="w-full font-bold"
                  options={[
                    { value: 30, label: "30 Seconds (Sprint)" },
                    { value: 60, label: "1 Minute (Official Standard)" },
                    { value: 120, label: "2 Minutes (Rhythm)" },
                    { value: 180, label: "3 Minutes (Endurance)" },
                    { value: 300, label: "5 Minutes (Master Marathon)" },
                  ]}
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <LuTarget className="text-[#52c41a]" />
                  <span>គោលដៅភាពត្រឹមត្រូវ (Target Accuracy)</span>
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

            {/* Assessment Rule Note */}
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-xs font-medium leading-relaxed flex items-start gap-2">
              <LuInfo className="shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" size={16} />
              <div>
                <strong>ច្បាប់តេស្ត៖</strong> នាឡិកានឹងចាប់ផ្តើមរាប់ថយក្រោយនៅពេលចុចគ្រាប់ចុចទីមួយ។ ល្បឿនសរុប ({speedUnit}) និងភាពត្រឹមត្រូវ (%) នឹងត្រូវបានគណនា និងរក្សាទុកក្នុង Profile ដោយស្វ័យប្រវត្តិ។
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <Button
                size="large"
                onClick={() => setSelectedTrack(null)}
                className="flex-1 font-bold h-12 rounded-xl"
              >
                Cancel (បោះបង់)
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<LuPlay size={18} />}
                onClick={() => handleStartTest(selectedTrack)}
                className="flex-2 font-black h-12 text-base bg-[#52c41a] hover:!bg-[#46aa16] border-0 rounded-xl shadow-md"
              >
                <span>Begin Assessment Test (ចាប់ផ្ដើមតេស្ត)</span>
                <LuArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
