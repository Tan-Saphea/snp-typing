import { useEffect, useState } from "react";
import { Alert, Button, Card, Modal, Radio, Rate, Result, Space, Spin, Tag, Typography } from "antd";
import {
  LuArrowRight,
  LuBookOpen,
  LuCircleCheckBig,
  LuRefreshCw,
  LuRotateCcw,
  LuTriangleAlert,
} from "react-icons/lu";

import Stars from "../../components/Stars.jsx";

const { Text, Title } = Typography;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export default function LessonResultModal({
  result,
  saving,
  saveError,
  onRetrySave,
  onTryAgain,
  onNext,
  onBack,
  hasNext,
  comprehension,
}) {
  const [selectedAnswer, setSelectedAnswer] = useState("");

  useEffect(() => {
    setSelectedAnswer("");
  }, [result?.id]);

  if (saving) {
    return (
      <Modal open centered footer={null} closable={false} width={380}>
        <div className="py-8 text-center">
          <Spin size="large" />
          <h3 className="m-0 mt-4 text-lg font-black text-slate-800 dark:text-slate-200">
            Saving your result…
          </h3>
          <p className="m-0 mt-1 text-xs text-slate-400">
            Syncing progress to your learner account.
          </p>
        </div>
      </Modal>
    );
  }

  if (saveError) {
    return (
      <Modal open centered footer={null} closable={false} width={420}>
        <div className="p-4 text-center">
          <Result
            status="error"
            title={<span className="font-black text-xl">Result Not Saved</span>}
            subTitle={<span className="text-sm text-slate-500">{saveError}</span>}
            extra={
              <Button
                type="primary"
                icon={<LuRefreshCw size={14} />}
                onClick={onRetrySave}
                className="font-bold px-6"
              >
                Retry Saving
              </Button>
            }
          />
        </div>
      </Modal>
    );
  }

  if (!result) return null;

  const passed = result.passed;
  const continueDisabled =
    !passed || !hasNext || Boolean(comprehension?.question && !selectedAnswer);

  return (
    <Modal
      open
      centered
      footer={null}
      closable={false}
      width={600}
      className="rounded-3xl overflow-hidden"
    >
      <div className="text-center pt-2">
        <div
          className={`mx-auto grid h-16 w-16 place-items-center rounded-3xl text-3xl mb-3 ${
            passed ? "bg-emerald-500/10 text-[#52c41a]" : "bg-orange-500/10 text-[#fa8c16]"
          }`}
        >
          {passed ? <LuCircleCheckBig size={32} /> : <LuRotateCcw size={32} />}
        </div>

        <Tag color={passed ? "success" : "warning"} className="font-bold uppercase tracking-wider rounded-md">
          {passed ? "Lesson Complete ✓" : "Practice Round"}
        </Tag>

        <h2 className="m-0 mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {passed ? "Great Job!" : "Keep Practicing!"}
        </h2>
        <p className="m-0 mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          {passed
            ? "You reached the passing accuracy threshold for this lesson."
            : "Aim for at least 70% accuracy to unlock the next lesson."}
        </p>

        <div className="my-4 flex justify-center">
          <Stars count={result.stars} size={28} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 my-5">
          {[
            ["WPM", Math.round(result.wpm)],
            ["CPM", Math.round(result.cpm)],
            ["Accuracy", `${Math.round(result.accuracy)}%`],
            ["Errors", result.errors],
            ["Time", formatTime(result.duration)],
            ["Score", result.score],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-2.5 text-center"
            >
              <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p className="m-0 mt-0.5 text-base font-black text-slate-900 dark:text-white">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Optional Comprehension Question */}
        {comprehension?.question && (
          <Card
            variant="outlined"
            className="my-5 text-left rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
            styles={{ body: { padding: "16px" } }}
          >
            <p className="m-0 text-[10px] font-black uppercase tracking-wider text-[#52c41a]">
              Story Comprehension Question
            </p>
            <h4 className="m-0 mt-1 text-sm font-black text-slate-900 dark:text-white">
              {comprehension.question}
            </h4>
            <div className="mt-3 space-y-2">
              {comprehension.options.map((option) => (
                <div
                  key={option}
                  onClick={() => setSelectedAnswer(option)}
                  className={`cursor-pointer rounded-xl border p-2.5 text-sm font-bold transition-all ${
                    selectedAnswer === option
                      ? "border-[#52c41a] bg-white dark:bg-slate-800 text-[#52c41a] shadow-sm"
                      : "border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {option}
                </div>
              ))}
            </div>
            {selectedAnswer && (
              <p
                className={`m-0 mt-3 text-xs font-bold ${
                  selectedAnswer === comprehension.answer ? "text-[#52c41a]" : "text-[#fa8c16]"
                }`}
              >
                {selectedAnswer === comprehension.answer
                  ? "✓ Correct answer!"
                  : `Answer: ${comprehension.answer}`}
              </p>
            )}
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <Button
            size="large"
            icon={<LuRotateCcw size={15} />}
            onClick={onTryAgain}
            className="font-bold flex items-center justify-center gap-1.5 h-11"
          >
            Try Again
          </Button>
          <Button
            size="large"
            icon={<LuBookOpen size={15} />}
            onClick={onBack}
            className="font-bold flex items-center justify-center gap-1.5 h-11"
          >
            Lessons List
          </Button>
          <Button
            type="primary"
            size="large"
            disabled={continueDisabled}
            onClick={onNext}
            className="font-bold flex items-center justify-center gap-1.5 h-11"
          >
            <span>
              {hasNext
                ? comprehension?.question && !selectedAnswer
                  ? "Answer to Continue"
                  : "Next Lesson"
                : "Level Complete"}
            </span>
            {hasNext && <LuArrowRight size={15} />}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
