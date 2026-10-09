import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Modal,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  LuArrowRight,
  LuCalendarDays,
  LuChartBar,
  LuClock3,
  LuDumbbell,
  LuGamepad2,
  LuGauge,
  LuKeyboard,
  LuLanguages,
  LuMonitor,
  LuSparkles,
  LuTarget,
  LuTimer,
  LuTrendingUp,
  LuTrophy,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import LearningCategoryCard, {
  learningCardPalette,
  learningCardPatterns,
} from "../components/LearningCategoryCard.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { Link } from "../components/NextRouter.jsx";
import PageHero from "../components/PageHero.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import Stars from "../components/Stars.jsx";
import { curriculumLevels } from "../data/curriculum.js";
import { getApiErrorMessage } from "../services/api.js";
import { getMyProgress } from "../services/progressService.js";
import { useAuthStore } from "../stores/authStore.js";

const { Text, Title } = Typography;

function formatPracticeTime(seconds) {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`;
}

function LearningCard({ language, summary }) {
  const isKhmer = language === "km";
  const levelNumber = summary.continueLesson?.level ?? 1;
  const level = curriculumLevels[language]?.find((item) => item.level === levelNumber);
  const Icon = isKhmer ? LuLanguages : LuKeyboard;

  return (
    <LearningCategoryCard
      accent={isKhmer ? "#722ed1" : "#1677ff"}
      actionLabel={summary.continueLesson ? "Continue lesson" : "View lessons"}
      badge={isKhmer ? "ខ្មែរ" : "EN"}
      deep={isKhmer ? "#391085" : "#0958d9"}
      description={
        summary.continueLesson
          ? `Continue “${summary.continueLesson.title}” and build steady muscle memory.`
          : level?.description
      }
      href={
        summary.continueLesson
          ? `/lessons/${summary.continueLesson.id}`
          : `/${isKhmer ? "khmer" : "english"}`
      }
      pattern={isKhmer ? "checker" : "stripes"}
      subtitle={`Level ${levelNumber} · ${level?.title}`}
      title={isKhmer ? "Khmer Typing" : "English Typing"}
      visual={<Icon />}
    >
      <div className="mt-2">
        <ProgressBar
          strokeColor={isKhmer ? "#722ed1" : "#1677ff"}
          label="Track Progress"
          value={summary.percent}
        />
      </div>
    </LearningCategoryCard>
  );
}

const exploreAreas = [
  {
    title: "Practice",
    subtitle: "ហាត់វាយអក្សរ",
    description: "Warm up with words, sentences, paragraphs, or your own magic custom text.",
    href: "/practice",
    icon: LuDumbbell,
  },
  {
    title: "Typing Test",
    subtitle: "តេស្តវាយអក្សរ",
    description: "Measure your speed and accuracy in focused 30s to 5min timed sessions.",
    href: "/typing-test",
    icon: LuTimer,
  },
  {
    title: "Typing Games",
    subtitle: "ល្បែងវាយអក្សរ",
    description: "Turn accurate English and Khmer typing into points, streaks, and stars.",
    href: "/games",
    icon: LuGamepad2,
  },
  {
    title: "Computer Skills",
    subtitle: "ជំនាញកុំព្យូទ័រ & ឌីជីថល",
    description: "240 bilingual quiz questions, shortcuts speed arena, and hardware explorer games.",
    href: "/computer-skills",
    icon: LuMonitor,
  },
  {
    title: "My Progress",
    subtitle: "វឌ្ឍនភាពរបស់ខ្ញុំ",
    description: "Review your speed trends, accuracy, star counts, and detailed history.",
    href: "/progress",
    icon: LuChartBar,
  },
  {
    title: "Leaderboard",
    subtitle: "តារាងពិន្ទុ",
    description: "Celebrate effort, speed, accuracy, and stars with other learners.",
    href: "/leaderboard",
    icon: LuTrophy,
  },
];

function ExploreCard({ area, index }) {
  const color = learningCardPalette[(index + 2) % learningCardPalette.length];
  const Icon = area.icon;

  return (
    <LearningCategoryCard
      accent={color.accent}
      actionLabel="Open activity"
      badge={String(index + 3).padStart(2, "0")}
      deep={color.deep}
      description={area.description}
      href={area.href}
      pattern={learningCardPatterns[(index + 2) % learningCardPatterns.length]}
      subtitle={area.subtitle}
      title={area.title}
      visual={<Icon />}
    />
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState({ loading: true, progress: null, error: "" });
  const [showWelcome, setShowWelcome] = useState(false);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setState({ loading: false, progress: await getMyProgress(), error: "" });
    } catch (error) {
      setState({ loading: false, progress: null, error: getApiErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (user && sessionStorage.getItem("snp-just-logged-in") === "true") {
      setShowWelcome(true);
      sessionStorage.removeItem("snp-just-logged-in");
    }
  }, [user]);

  if (state.loading) return <PageLoader message="Preparing your dashboard…" />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const { progress } = state;
  const maxMinutes = Math.max(...progress.weekly.map((day) => day.minutes), 1);

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <PageHero
        badges={[
          { icon: LuSparkles, label: `${progress.stats.dailyStreak} day streak` },
          { icon: LuTrophy, label: `${progress.stats.stars} stars earned` },
        ]}
        description="Ready to improve your typing today? Complete a lesson, sharpen your accuracy, and watch your speed grow step by step."
        eyebrow="Student Dashboard"
        icon={LuSparkles}
        title={`Hello, ${user?.firstName || user?.username}!`}
        tone="emerald"
        actions={
          <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-md border border-white/20 text-white">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fa8c16] text-white">
              <LuTrophy size={20} />
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Stars Earned
              </p>
              <p className="m-0 text-xl font-black text-white">{progress.stats.stars}</p>
            </div>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={LuClock3}
          label="Typing Time"
          note="Total practice time"
          tone="sky"
          value={formatPracticeTime(progress.stats.totalPracticeSeconds)}
        />
        <MetricCard
          icon={LuGauge}
          label="English WPM"
          note="Personal best speed"
          tone="emerald"
          value={Math.round(progress.stats.bestWpm)}
        />
        <MetricCard
          icon={LuKeyboard}
          label="Khmer CPM"
          note="Grapheme-aware best"
          tone="violet"
          value={Math.round(progress.stats.bestCpm)}
        />
        <MetricCard
          icon={LuTarget}
          label="Average Accuracy"
          note="Target 70%+"
          tone="amber"
          value={`${Math.round(progress.stats.averageAccuracy)}%`}
        />
      </div>

      {/* Learning Modules Grid */}
      <div>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-black uppercase tracking-wider text-[#52c41a]">
              Learning Library
            </p>
            <h2 className="m-0 mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Choose what to learn
            </h2>
          </div>
          <p className="m-0 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
            Lessons and computer skills unlock in sequence. Practice, tests, and games stay open anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <LearningCard language="en" summary={progress.languages.en} />
          <LearningCard language="km" summary={progress.languages.km} />
          {exploreAreas.map((area, index) => (
            <ExploreCard area={area} index={index} key={area.href} />
          ))}
        </div>
      </div>

      {/* Recent Activity & Weekly Rhythm Cards */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          variant="outlined"
          title={<span className="text-base font-black">Recent Activity</span>}
          extra={
            <Link to="/progress" className="font-bold text-xs text-[#52c41a] flex items-center gap-1 hover:underline">
              <span>View full history</span>
              <LuArrowRight size={14} />
            </Link>
          }
          className="rounded-2xl shadow-sm dark:border-slate-800"
          styles={{ body: { padding: "16px 24px" } }}
        >
          {progress.recent.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {progress.recent.slice(0, 4).map((item) => (
                <div className="flex items-center gap-4 py-3.5" key={item.id}>
                  <div
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                      item.lesson?.language === "km"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {item.lesson?.language === "km" ? <LuLanguages size={20} /> : <LuKeyboard size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate font-black text-slate-900 dark:text-white">
                      {item.lesson?.title || "Archived lesson"}
                    </p>
                    <p className="m-0 mt-0.5 flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <LuCalendarDays size={13} />
                      <span>{new Date(item.completedAt).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {item.lesson?.language === "km" ? `${Math.round(item.cpm)} CPM` : `${Math.round(item.wpm)} WPM`}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Stars count={item.stars} size={14} />
                    <p className="m-0 mt-0.5 text-xs font-black text-[#52c41a]">
                      {Math.round(item.accuracy)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm font-medium text-slate-400">
              Complete your first lesson to see your achievements here!
            </div>
          )}
        </Card>

        {/* Weekly Chart */}
        <Card
          variant="outlined"
          title={<span className="text-base font-black">Weekly Rhythm</span>}
          extra={<LuTrendingUp className="text-[#52c41a]" size={18} />}
          className="rounded-2xl shadow-sm dark:border-slate-800"
          styles={{ body: { padding: "20px 24px" } }}
        >
          <p className="m-0 text-xs font-medium text-slate-400 mb-6">
            Practice minutes per day (Last 7 days)
          </p>
          <div
            className="flex h-44 items-end justify-between gap-2"
            role="img"
            aria-label="Weekly practice minutes chart"
          >
            {progress.weekly.map((day) => (
              <div
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                key={day.date}
                title={`${day.label}: ${day.minutes} minutes`}
              >
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {day.minutes || ""}
                </span>
                <div
                  className="w-full max-w-9 rounded-t-lg bg-gradient-to-t from-[#2e7d32] to-[#52c41a] transition-all"
                  style={{
                    height: `${Math.max(day.minutes ? 14 : 4, (day.minutes / maxMinutes) * 120)}px`,
                  }}
                />
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {day.label.slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Welcome Modal Popup */}
      <Modal
        open={showWelcome}
        onCancel={() => setShowWelcome(false)}
        footer={[
          <Button
            key="start"
            type="primary"
            size="large"
            onClick={() => setShowWelcome(false)}
            className="w-full font-bold flex items-center justify-center gap-2 h-11"
          >
            <LuSparkles />
            <span>Let's Practice!</span>
          </Button>,
        ]}
        centered
        width={420}
      >
        <div className="text-center pt-2">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-3xl text-[#52c41a] mb-4">
            <LuSparkles size={28} />
          </div>
          <h3 className="m-0 text-2xl font-black text-slate-900 dark:text-white">
            Welcome back, {user?.firstName || user?.username}!
          </h3>
          <p className="m-0 mt-2 text-sm text-slate-500 leading-relaxed">
            Ready to build your typing confidence today? One accurate key at a time leads to fluent speed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
