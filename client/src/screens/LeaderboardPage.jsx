import { useEffect, useState } from "react";
import { Avatar, Badge, Card, Col, Row, Segmented, Space, Table, Tag, Typography } from "antd";
import {
  LuActivity,
  LuGauge,
  LuMedal,
  LuSparkles,
  LuStar,
  LuTarget,
  LuTrophy,
  LuUser,
  LuUsers,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import PageHero from "../components/PageHero.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getLeaderboard } from "../services/leaderboardService.js";

const { Title, Text } = Typography;

const periods = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

const categories = [
  { value: "score", label: "Total Score", icon: <LuTrophy className="inline mr-1" size={14} /> },
  { value: "english-wpm", label: "English WPM", icon: <LuGauge className="inline mr-1" size={14} /> },
  { value: "khmer-cpm", label: "Khmer CPM", icon: <LuActivity className="inline mr-1" size={14} /> },
  { value: "accuracy", label: "Accuracy", icon: <LuTarget className="inline mr-1" size={14} /> },
  { value: "stars", label: "Stars", icon: <LuStar className="inline mr-1" size={14} /> },
];

function valueLabel(category, value) {
  const rounded = Math.round(value);
  if (category === "english-wpm") return `${rounded} WPM`;
  if (category === "khmer-cpm") return `${rounded} CPM`;
  if (category === "accuracy") return `${rounded}%`;
  if (category === "stars") return `${rounded} ★`;
  return rounded.toLocaleString();
}

function LearnerName({ student }) {
  const name =
    [student.firstName, student.lastName].filter(Boolean).join(" ") || "SNP Learner";
  return (
    <div>
      <p className="m-0 font-bold text-slate-900 dark:text-white text-sm">{name}</p>
      {student.khmerName && (
        <p className="m-0 text-xs text-[#52c41a] font-medium" lang="km">
          {student.khmerName}
        </p>
      )}
    </div>
  );
}

const podiumColors = [
  "from-amber-400 to-yellow-500 text-slate-950",
  "from-slate-300 to-slate-400 text-slate-950",
  "from-amber-600 to-amber-700 text-white",
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("week");
  const [category, setCategory] = useState("score");
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    getLeaderboard({ period, category })
      .then((data) => setState({ loading: false, data, error: "" }))
      .catch((error) =>
        setState({ loading: false, data: null, error: getApiErrorMessage(error) })
      );
  }, [category, period]);

  const selectedCategory = categories.find((item) => item.value === category);
  const entries = state.data?.entries ?? [];

  const columns = [
    {
      title: "Rank",
      key: "rank",
      width: 70,
      render: (_, __, index) => (
        <div
          className={`grid h-8 w-8 place-items-center rounded-xl font-black text-xs ${
            index === 0
              ? "bg-amber-400 text-slate-950 shadow-sm"
              : index === 1
              ? "bg-slate-300 text-slate-900"
              : index === 2
              ? "bg-amber-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          }`}
        >
          {index < 3 ? <LuMedal size={16} /> : index + 1}
        </div>
      ),
    },
    {
      title: "Learner",
      dataIndex: "student",
      key: "student",
      render: (student) => <LearnerName student={student} />,
    },
    {
      title: "Attempts",
      dataIndex: "attempts",
      key: "attempts",
      responsive: ["sm"],
      render: (attempts) => (
        <span className="text-xs text-slate-400 font-medium">{attempts} attempts</span>
      ),
    },
    {
      title: selectedCategory?.label ?? "Score",
      dataIndex: "value",
      key: "value",
      align: "right",
      render: (val) => (
        <span className="text-base font-black text-[#52c41a]">
          {valueLabel(category, val)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHero
        badges={[
          { icon: LuUsers, label: "Community Ranking" },
          { icon: LuSparkles, label: "Celebrate Effort & Accuracy" },
        ]}
        description="Friendly scores and rankings across speed, accuracy, stars, and total effort. Every completed lesson moves your ranking forward."
        eyebrow="Learner Community"
        icon={LuTrophy}
        title="Leaderboard Rankings"
        tone="ink"
      />

      {/* Filter Segmented Controls */}
      <Card
        variant="outlined"
        className="rounded-2xl shadow-sm dark:border-slate-800"
        styles={{ body: { padding: "16px 20px" } }}
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Time Period:
            </span>
            <Segmented
              options={periods}
              value={period}
              onChange={(val) => setPeriod(val)}
              className="font-bold"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Ranking Category:
            </span>
            <Segmented
              options={categories.map((c) => ({
                value: c.value,
                label: (
                  <span className="flex items-center gap-1">
                    {c.icon}
                    <span>{c.label}</span>
                  </span>
                ),
              }))}
              value={category}
              onChange={(val) => setCategory(val)}
              className="font-bold overflow-x-auto"
            />
          </div>
        </div>
      </Card>

      {state.loading ? (
        <PageLoader message="Updating the ranking leaderboard…" />
      ) : state.error ? (
        <PageError message={state.error} />
      ) : entries.length ? (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {entries.slice(0, 3).map((entry, index) => (
              <Card
                key={entry.student.id}
                variant="outlined"
                className="relative overflow-hidden rounded-2xl shadow-sm dark:border-slate-800"
                styles={{ body: { padding: "24px" } }}
              >
                <div className="absolute right-4 top-2 text-7xl font-black opacity-[0.04] select-none">
                  #{index + 1}
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${podiumColors[index]} text-2xl shadow-md`}
                  >
                    <LuMedal />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Rank #{index + 1}
                    </p>
                    <LearnerName student={entry.student} />
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div>
                    <p className="m-0 text-xl font-black text-[#52c41a]">
                      {valueLabel(category, entry.value)}
                    </p>
                    <p className="m-0 text-xs text-slate-400 font-medium">
                      {selectedCategory?.label}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {entry.attempts} attempts
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Full Rankings Table Card */}
          <Card
            variant="outlined"
            title={<span className="text-base font-black">All Ranked Learners</span>}
            extra={
              <Tag color="success" className="font-bold rounded-md">
                {periods.find((p) => p.value === period)?.label}
              </Tag>
            }
            className="rounded-2xl shadow-sm dark:border-slate-800 overflow-hidden"
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={columns}
              dataSource={entries}
              rowKey={(r) => r.student.id}
              pagination={{ pageSize: 10 }}
              className="font-medium"
            />
          </Card>
        </>
      ) : (
        <Card
          variant="outlined"
          className="rounded-2xl p-10 text-center shadow-sm dark:border-slate-800"
        >
          <LuTrophy className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={48} />
          <h3 className="m-0 text-lg font-black text-slate-800 dark:text-slate-200">
            The podium is ready
          </h3>
          <p className="m-0 mt-1 text-sm text-slate-500 max-w-md mx-auto">
            No learner results recorded for this category yet. Complete a lesson or test to claim the #1 spot!
          </p>
        </Card>
      )}
    </div>
  );
}
