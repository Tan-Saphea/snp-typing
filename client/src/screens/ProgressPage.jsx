import { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Progress, Row, Space, Table, Tag, Typography } from "antd";
import {
  LuArrowRight,
  LuBookOpenCheck,
  LuCalendarDays,
  LuClock3,
  LuFileText,
  LuFlame,
  LuGauge,
  LuKeyboard,
  LuLanguages,
  LuMedal,
  LuMonitor,
  LuSparkles,
  LuStar,
  LuTarget,
  LuTimer,
  LuTrendingUp,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import MetricCard from "../components/MetricCard.jsx";
import { Link } from "../components/NextRouter.jsx";
import PageHero from "../components/PageHero.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import Stars from "../components/Stars.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getMyProgress } from "../services/progressService.js";

const { Text, Title } = Typography;

function formatPracticeTime(seconds) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function ComputerSkillsProgressCard({ summary }) {
  return (
    <Card
      variant="outlined"
      className="rounded-2xl shadow-sm dark:border-slate-800 flex flex-col justify-between"
      styles={{ body: { padding: "24px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" } }}
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Tag color="success" className="font-bold uppercase tracking-wider">
              DIGITAL SKILLS · ជំនាញឌីជីថល
            </Tag>
            <h3 className="m-0 mt-2 text-xl font-black text-slate-900 dark:text-white">
              Computer Skills Lab
            </h3>
            <p className="m-0 mt-1 text-xs text-slate-500 font-medium">
              {summary.completedLessons} of {summary.totalLessons} Word Skills lessons passed
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <LuMonitor size={24} />
          </div>
        </div>

        <div className="mt-6">
          <ProgressBar
            strokeColor="#52c41a"
            label="Word Skills Track Completion"
            value={summary.percent}
          />
        </div>
      </div>

      <Link to="/computer-skills" className="block mt-6">
        <Button
          type="primary"
          className="w-full flex items-center justify-center gap-2 font-bold h-11 bg-[#52c41a] hover:!bg-[#46aa16] border-0"
        >
          <span>Open Computer Skills</span>
          <LuArrowRight size={16} />
        </Button>
      </Link>
    </Card>
  );
}

function LearningProgressCard({ language, summary }) {
  const isKhmer = language === "km";
  return (
    <Card
      variant="outlined"
      className="rounded-2xl shadow-sm dark:border-slate-800"
      styles={{ body: { padding: "24px" } }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <Tag color={isKhmer ? "purple" : "blue"} className="font-bold uppercase tracking-wider">
            {isKhmer ? "ខ្មែរ NIDA" : "English QWERTY"}
          </Tag>
          <h3 className="m-0 mt-2 text-xl font-black text-slate-900 dark:text-white">
            {isKhmer ? "Khmer Typing Curriculum" : "English Typing Curriculum"}
          </h3>
          <p className="m-0 mt-1 text-xs text-slate-500 font-medium">
            {summary.completedLessons} of {summary.totalLessons} lessons passed
          </p>
        </div>
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
            isKhmer ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          }`}
        >
          {isKhmer ? <LuLanguages size={24} /> : <LuKeyboard size={24} />}
        </div>
      </div>

      <div className="mt-6">
        <ProgressBar
          strokeColor={isKhmer ? "#722ed1" : "#1677ff"}
          label="Overall Track Completion"
          value={summary.percent}
        />
      </div>

      <Link to={isKhmer ? "/khmer" : "/english"} className="block mt-6">
        <Button
          type="primary"
          className="w-full flex items-center justify-center gap-2 font-bold h-11"
        >
          <span>Open {isKhmer ? "Khmer" : "English"} Lessons</span>
          <LuArrowRight size={16} />
        </Button>
      </Link>
    </Card>
  );
}

export default function ProgressPage() {
  const [state, setState] = useState({ loading: true, progress: null, error: "" });

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

  if (state.loading) return <PageLoader message="Calculating your progress records…" />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const { progress } = state;
  const maxMinutes = Math.max(...progress.weekly.map((day) => day.minutes), 1);
  const totalWeekMinutes = progress.weekly.reduce((sum, day) => sum + day.minutes, 0);

  const columns = [
    {
      title: "Activity",
      dataIndex: "lesson",
      key: "lesson",
      render: (lesson, record) => {
        const isKhmer = lesson?.language === "km";
        return (
          <div className="flex items-center gap-3">
            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                isKhmer ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              }`}
            >
              {isKhmer ? <LuLanguages size={18} /> : <LuKeyboard size={18} />}
            </div>
            <div>
              <p className="m-0 font-bold text-slate-900 dark:text-white text-sm">
                {lesson?.title || "Archived lesson"}
              </p>
              <p className="m-0 text-xs text-slate-400 font-medium">
                {new Date(record.completedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Speed",
      key: "speed",
      render: (_, record) => {
        const isKhmer = record.lesson?.language === "km";
        return (
          <span className="font-black text-slate-800 dark:text-slate-200">
            {isKhmer ? `${Math.round(record.cpm)} CPM` : `${Math.round(record.wpm)} WPM`}
          </span>
        );
      },
    },
    {
      title: "Accuracy",
      dataIndex: "accuracy",
      key: "accuracy",
      render: (val) => (
        <span className="font-black text-[#52c41a]">{Math.round(val)}%</span>
      ),
    },
    {
      title: "Stars",
      dataIndex: "stars",
      key: "stars",
      render: (stars) => <Stars count={stars} size={14} />,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHero
        actions={
          <Link to="/report">
            <Button
              type="primary"
              size="large"
              icon={<LuFileText size={16} />}
              className="font-bold flex items-center gap-2 h-11"
            >
              Print A4 Learning Report
            </Button>
          </Link>
        }
        badges={[
          { icon: LuFlame, label: `${progress.stats.dailyStreak} day streak` },
          { icon: LuStar, label: `${progress.stats.stars} stars earned` },
        ]}
        description="Comprehensive analytics of your typing journey across English and Khmer tracks, speed metrics, accuracy, and practice rhythm."
        eyebrow="Learner Report"
        icon={LuTrendingUp}
        title="Your Progress & Analytics"
        tone="violet"
      />

      {/* Highlights Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={LuBookOpenCheck}
          label="Lessons Completed"
          note="70% accuracy requirement"
          tone="emerald"
          value={progress.stats.lessonsCompleted}
        />
        <MetricCard
          icon={LuGauge}
          label="Best English Speed"
          note={`${Math.round(progress.stats.averageWpm)} WPM average`}
          tone="sky"
          value={`${Math.round(progress.stats.bestWpm)} WPM`}
        />
        <MetricCard
          icon={LuKeyboard}
          label="Best Khmer Speed"
          note="Grapheme-aware CPM"
          tone="violet"
          value={`${Math.round(progress.stats.bestCpm)} CPM`}
        />
        <MetricCard
          icon={LuTarget}
          label="Average Accuracy"
          note={`${Math.round(progress.stats.bestAccuracy)}% personal best`}
          tone="amber"
          value={`${Math.round(progress.stats.averageAccuracy)}%`}
        />
      </div>

      {/* Weekly Rhythm Chart & Secondary Metrics */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card
          variant="outlined"
          title={<span className="text-base font-black">7-Day Practice Rhythm</span>}
          extra={<span className="text-xs font-bold text-slate-400">{Math.round(totalWeekMinutes)}m this week</span>}
          className="rounded-2xl shadow-sm dark:border-slate-800"
          styles={{ body: { padding: "24px" } }}
        >
          <div
            className="flex h-52 items-end justify-between gap-2"
            role="img"
            aria-label="Practice minutes for the last 7 days"
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
                  className="w-full max-w-10 rounded-t-xl bg-gradient-to-t from-[#2e7d32] to-[#52c41a] transition-all shadow-sm"
                  style={{
                    height: `${Math.max(day.minutes ? 16 : 6, (day.minutes / maxMinutes) * 150)}px`,
                  }}
                />
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {day.label.slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard
            icon={LuClock3}
            label="Total Practice Time"
            note="Across all activities"
            tone="sky"
            value={formatPracticeTime(progress.stats.totalPracticeSeconds)}
          />
          <MetricCard
            icon={LuTimer}
            label="Timed Tests"
            note="Recorded assessments"
            tone="rose"
            value={progress.stats.testsCompleted}
          />
          <MetricCard
            icon={LuFlame}
            label="Daily Streak"
            note="Practice today to continue"
            tone="amber"
            value={`${progress.stats.dailyStreak} days`}
          />
          <MetricCard
            icon={LuMedal}
            label="Current Levels"
            note="Unlocked milestones"
            tone="violet"
            value={`EN Level ${progress.stats.currentEnglishLevel} · KM Level ${progress.stats.currentKhmerLevel}`}
          />
        </div>
      </div>

      {/* Course Completion Tracks */}
      <div>
        <div className="mb-4">
          <p className="m-0 text-xs font-black uppercase tracking-wider text-[#52c41a]">
            Curriculum Paths
          </p>
          <h2 className="m-0 mt-1 text-2xl font-black text-slate-900 dark:text-white">
            Track Progress
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <LearningProgressCard language="en" summary={progress.languages.en} />
          <LearningProgressCard language="km" summary={progress.languages.km} />
          <ComputerSkillsProgressCard summary={progress.computerSkills} />
        </div>
      </div>

      {/* Results History Table */}
      <Card
        variant="outlined"
        title={<span className="text-base font-black">Recent Activity Log</span>}
        extra={
          <Link to="/practice">
            <Button type="primary" size="small" className="font-bold">
              Practice Now
            </Button>
          </Link>
        }
        className="rounded-2xl shadow-sm dark:border-slate-800 overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={progress.recent}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          className="font-medium"
        />
      </Card>
    </div>
  );
}
