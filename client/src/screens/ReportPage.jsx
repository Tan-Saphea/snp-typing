import { useCallback, useEffect, useState } from "react";
import {
  LuBookOpenCheck,
  LuCalendarDays,
  LuFileText,
  LuPrinter,
  LuShieldCheck,
  LuTarget,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import PageHero from "../components/PageHero.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getMyProgress } from "../services/progressService.js";
import { useAuthStore } from "../stores/authStore.js";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function ReportMetric({ label, value }) {
  return <div className="snp-report-metric"><span>{label}</span><strong>{value}</strong></div>;
}

function CourseRow({ label, summary, tone }) {
  return (
    <div className="snp-report-course-row">
      <div><strong>{label}</strong><span>{summary.completedLessons} / {summary.totalLessons} lessons passed</span></div>
      <div className="snp-report-progress"><span className={tone} style={{ width: `${summary.percent}%` }} /></div>
      <b>{summary.percent}%</b>
    </div>
  );
}

export default function ReportPage() {
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState({ loading: true, progress: null, error: "" });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setState({ loading: false, progress: await getMyProgress(), error: "" });
    } catch (error) {
      setState({ loading: false, progress: null, error: getApiErrorMessage(error) });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  if (state.loading) return <PageLoader message="Preparing your A4 report…" />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;

  const { progress } = state;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username;
  const learnerId = user?.studentId || user?.id?.slice(-8).toUpperCase() || "-";
  const generatedAt = new Date();

  return (
    <div className="space-y-6">
      <div className="snp-print-hidden">
        <PageHero
          actions={<button className="snp-button-primary" onClick={() => window.print()} type="button"><LuPrinter />Print / Save PDF</button>}
          badges={[
            { icon: LuFileText, label: "A4 portrait" },
            { icon: LuShieldCheck, label: "Personal progress only" },
          ]}
          description="A clean one-page summary of your identity, course completion, practice rhythm, and latest results."
          eyebrow="Printable learning record"
          icon={LuFileText}
          title="A4 Progress Report"
          tone="emerald"
        />
      </div>

      <div className="snp-report-stage">
        <article className="snp-report-sheet" aria-label="A4 learner progress report">
          <div className="snp-report-header">
            <div className="snp-report-brand"><span>SNP</span><div><strong>SNP Typing</strong><small>English and Khmer Learning</small></div></div>
            <div className="snp-report-heading"><p>LEARNER RECORD</p><h1>Progress Report</h1><span>Generated {formatDate(generatedAt)}</span></div>
          </div>

          <section className="snp-report-identity">
            <div><span>Learner name</span><strong>{fullName}</strong></div>
            <div><span>Khmer name</span><strong lang="km">{user?.khmerName || "-"}</strong></div>
            <div><span>Username</span><strong>@{user?.username}</strong></div>
            <div><span>Learner ID</span><strong>{learnerId}</strong></div>
          </section>

          <section>
            <h2 className="snp-report-section-title">Performance overview</h2>
            <div className="snp-report-metrics">
              <ReportMetric label="Lessons passed" value={progress.stats.lessonsCompleted} />
              <ReportMetric label="Best English speed" value={`${Math.round(progress.stats.bestWpm)} WPM`} />
              <ReportMetric label="Best Khmer speed" value={`${Math.round(progress.stats.bestCpm)} CPM`} />
              <ReportMetric label="Average accuracy" value={`${Math.round(progress.stats.averageAccuracy)}%`} />
            </div>
          </section>

          <section>
            <h2 className="snp-report-section-title">Course completion</h2>
            <div className="snp-report-courses">
              <CourseRow label="English Typing" summary={progress.languages.en} tone="snp-report-progress-en" />
              <CourseRow label="Khmer Typing" summary={progress.languages.km} tone="snp-report-progress-km" />
            </div>
          </section>

          <section>
            <div className="snp-report-section-heading"><h2 className="snp-report-section-title">Last 7 days</h2><span>{progress.weekly.reduce((sum, day) => sum + day.minutes, 0).toFixed(1)} total minutes</span></div>
            <div className="snp-report-week">
              {progress.weekly.map((day) => <div key={day.date}><span>{day.label}</span><strong>{day.minutes}</strong><small>min</small></div>)}
            </div>
          </section>

          <section>
            <div className="snp-report-section-heading"><h2 className="snp-report-section-title">Recent results</h2><span>Most recent saved activities</span></div>
            <table className="snp-report-table">
              <thead><tr><th>Activity</th><th>Date</th><th>Speed</th><th>Accuracy</th><th>Stars</th></tr></thead>
              <tbody>
                {progress.recent.length ? progress.recent.map((item) => {
                  const khmer = item.lesson?.language === "km";
                  return <tr key={item.id}><td>{item.lesson?.title || "Archived lesson"}</td><td>{formatDate(item.completedAt)}</td><td>{khmer ? `${Math.round(item.cpm)} CPM` : `${Math.round(item.wpm)} WPM`}</td><td>{Math.round(item.accuracy)}%</td><td>{item.stars} / 3</td></tr>;
                }) : <tr><td className="snp-report-empty" colSpan="5">No completed activities yet.</td></tr>}
              </tbody>
            </table>
          </section>

          <div className="snp-report-signatures">
            <div><span>Learner signature</span></div>
            <div><span>Parent / teacher signature</span></div>
          </div>

          <div className="snp-report-footer"><span><LuCalendarDays /> Report date: {formatDate(generatedAt)}</span><span><LuBookOpenCheck /> Step-by-step learning record</span><span><LuTarget /> Pass mark: lesson requirement</span></div>
        </article>
      </div>
    </div>
  );
}
