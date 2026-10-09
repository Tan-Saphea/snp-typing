import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button, Input, Modal, Progress, Tag, Tooltip } from "antd";
import {
  LuArrowLeft,
  LuArrowRight,
  LuAward,
  LuBookOpen,
  LuBot,
  LuChartBar,
  LuCheck,
  LuClock,
  LuFileText,
  LuFlame,
  LuGlobe,
  LuKeyboard,
  LuLayers,
  LuMaximize,
  LuMinimize,
  LuMonitor,
  LuPlay,
  LuRefreshCw,
  LuRotateCcw,
  LuSearch,
  LuShieldCheck,
  LuSparkles,
  LuStar,
  LuTarget,
  LuTimer,
  LuTrophy,
  LuTv,
  LuVolume2,
  LuVolumeX,
  LuX,
  LuZap,
} from "react-icons/lu";

import LearningCategoryCard, {
  learningCardPalette,
  learningCardPatterns,
} from "./LearningCategoryCard.jsx";
import MetricCard from "./MetricCard.jsx";

import {
  getAllQuestions,
  getCategoryById,
  quizCategories,
  quizCategoryGroups,
  quizSessionLengths,
  sampleCategoryQuestions,
  shuffleArray,
  shuffleQuestionOptions,
} from "../data/quiz/index.js";

function getCategoryVisualIcon(topicId) {
  switch (topicId) {
    case "hardware":
      return <LuMonitor size={44} />;
    case "cyber-safety":
      return <LuShieldCheck size={44} />;
    case "shortcuts":
      return <LuKeyboard size={44} />;
    case "internet-tools":
      return <LuGlobe size={44} />;
    case "word-processing":
      return <LuFileText size={44} />;
    case "excel-data":
      return <LuChartBar size={44} />;
    case "presentation":
      return <LuTv size={44} />;
    case "ai-technology":
      return <LuBot size={44} />;
    default:
      return <LuSparkles size={44} />;
  }
}

// Synthesized Web Audio sounds for instant auditory feedback
function playSound(type, isMuted = false) {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "correct") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "streak") {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.2);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.2);
      });
    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(146.83, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "complete") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.14, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.09 + 0.3);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.3);
      });
    }
  } catch (e) {}
}

// Helper to parse and format bilingual option (Khmer above, English below)
function parseBilingualOption(option) {
  if (!option) return { km: "", en: "" };
  if (typeof option === "object") {
    return {
      km: option.km || option.khmer || "",
      en: option.en || option.english || "",
    };
  }

  const str = String(option).trim();
  const isKhmerFirst = /^[\u1780-\u17FF]/.test(str);
  const match = str.match(/^(.*?)\s*\((.*?)\)$/);

  if (match) {
    const part1 = match[1].trim();
    const part2 = match[2].trim();
    if (isKhmerFirst) {
      return { km: part1, en: part2 };
    } else {
      return { km: part2, en: part1 };
    }
  }

  return { km: str, en: "" };
}

export default function DigitalLiteracyQuiz() {
  const containerRef = useRef(null);

  // Session & Quiz State
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [sessionModalTopic, setSessionModalTopic] = useState(null);
  const [sessionQuestionCount, setSessionQuestionCount] = useState(10);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [floatingXp, setFloatingXp] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [reviewFilter, setReviewFilter] = useState("all"); // 'all' | 'mistakes' | 'correct'
  const [savedScores, setSavedScores] = useState({});

  // Timers & Duration
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [timedMode, setTimedMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25); // 25s per question in timed mode

  // UX & Fullscreen Options
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Dashboard filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

  // Load saved preferences & scores on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("snp_digital_quiz_progress");
      if (saved) setSavedScores(JSON.parse(saved));
      const muted = localStorage.getItem("snp_digital_quiz_muted");
      if (muted !== null) setIsMuted(muted === "true");
    } catch (e) {}
  }, []);

  // Listen for browser native fullscreen changes
  useEffect(() => {
    function handleFsChange() {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Session elapsed timer
  useEffect(() => {
    if (!selectedTopic || isCompleted) return;
    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
      setQuestionSeconds((prev) => prev + 1);
      if (timedMode && !isAnswered) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedTopic, isCompleted, isAnswered, timedMode]);

  // Toggle Mute Audio
  function toggleMute() {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("snp_digital_quiz_muted", String(next));
      } catch (e) {}
      return next;
    });
  }

  // Toggle Native Browser Fullscreen
  function toggleBrowserFullscreen() {
    if (!document.fullscreenElement) {
      const elem = containerRef.current || document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  // Start a Quiz Session
  function startQuizSession(topic, count, customQuestions = null, isTimed = false) {
    let questionsToUse = [];
    if (customQuestions) {
      questionsToUse = shuffleArray(customQuestions).map((q) => shuffleQuestionOptions(q));
    } else if (topic.id === "all-mixed") {
      const all = getAllQuestions();
      const shuffled = shuffleArray(all).slice(0, count || 15);
      questionsToUse = shuffled.map((q) => shuffleQuestionOptions(q));
    } else {
      questionsToUse = sampleCategoryQuestions(topic.id, count);
    }

    setSelectedTopic(topic);
    setActiveQuestions(questionsToUse);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setXp(0);
    setFloatingXp(null);
    setIsCompleted(false);
    setSessionHistory([]);
    setReviewFilter("all");
    setSessionSeconds(0);
    setQuestionSeconds(0);
    setTimedMode(isTimed);
    setTimeLeft(25);
    setSessionModalTopic(null);
    setShowQuitConfirm(false);
  }

  // Timeout handler for Timed Mode
  const handleTimeOut = useCallback(() => {
    if (isAnswered || !activeQuestions[currentQuestionIndex]) return;
    setIsAnswered(true);
    setSelectedOption(-1); // -1 signifies timeout
    const question = activeQuestions[currentQuestionIndex];
    setSessionHistory((prev) => [
      ...prev,
      { question, selectedOptionIndex: -1, isCorrect: false, timeSpent: 25 },
    ]);
    playSound("wrong", isMuted);
    setStreak(0);
  }, [isAnswered, activeQuestions, currentQuestionIndex, isMuted]);

  // Option selection
  const handleSelectOption = useCallback(
    (index) => {
      if (isAnswered || !activeQuestions[currentQuestionIndex]) return;

      setSelectedOption(index);
      setIsAnswered(true);

      const question = activeQuestions[currentQuestionIndex];
      const isCorrect = index === question.answerIndex;

      setSessionHistory((prev) => [
        ...prev,
        {
          question,
          selectedOptionIndex: index,
          isCorrect,
          timeSpent: questionSeconds,
        },
      ]);

      if (isCorrect) {
        const newStreak = streak + 1;
        const streakBonus = Math.min(newStreak, 5) * 20;
        const pointsGained = 100 + streakBonus;

        setScore((prev) => prev + 1);
        setStreak(newStreak);
        if (newStreak > maxStreak) setMaxStreak(newStreak);
        setXp((prev) => prev + pointsGained);

        setFloatingXp({ text: `+${pointsGained} XP`, key: Date.now() });

        if (newStreak >= 3) {
          playSound("streak", isMuted);
        } else {
          playSound("correct", isMuted);
        }
      } else {
        playSound("wrong", isMuted);
        setStreak(0);
      }
    },
    [isAnswered, activeQuestions, currentQuestionIndex, questionSeconds, streak, maxStreak, isMuted]
  );

  // Advance to next question or complete
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setQuestionSeconds(0);
      setTimeLeft(25);
      setFloatingXp(null);
    } else {
      playSound("complete", isMuted);
      setIsCompleted(true);

      const finalScore = score;
      const total = activeQuestions.length;
      const pct = Math.round((finalScore / total) * 100);
      const stars = pct >= 80 ? 3 : pct >= 60 ? 2 : pct >= 40 ? 1 : 0;

      if (selectedTopic && selectedTopic.id !== "all-mixed") {
        const updated = {
          ...savedScores,
          [selectedTopic.id]: {
            bestScore: Math.max(savedScores[selectedTopic.id]?.bestScore || 0, finalScore),
            totalQuestions: selectedTopic.questions?.length || total,
            bestStars: Math.max(savedScores[selectedTopic.id]?.bestStars || 0, stars),
            bestAccuracy: Math.max(savedScores[selectedTopic.id]?.bestAccuracy || 0, pct),
            lastPlayedAt: new Date().toISOString(),
          },
        };
        setSavedScores(updated);
        try {
          localStorage.setItem("snp_digital_quiz_progress", JSON.stringify(updated));
        } catch (e) {}
      }
    }
  }, [currentQuestionIndex, activeQuestions.length, score, selectedTopic, savedScores, isMuted]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!selectedTopic) return;

    function handleKeyDown(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      // Fullscreen shortcut 'F'
      if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleBrowserFullscreen();
        return;
      }

      // Mute audio shortcut 'M'
      if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleMute();
        return;
      }

      // Exit / Pause shortcut 'Escape'
      if (e.key === "Escape") {
        if (!isCompleted) {
          setShowQuitConfirm(true);
        } else {
          setSelectedTopic(null);
        }
        return;
      }

      if (!isCompleted) {
        if (!isAnswered) {
          if (e.key === "1" || e.key === "a" || e.key === "A") handleSelectOption(0);
          else if (e.key === "2" || e.key === "b" || e.key === "B") handleSelectOption(1);
          else if (e.key === "3" || e.key === "c" || e.key === "C") handleSelectOption(2);
          else if (e.key === "4" || e.key === "d" || e.key === "D") handleSelectOption(3);
        } else {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleNextQuestion();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTopic, isCompleted, isAnswered, handleSelectOption, handleNextQuestion]);

  // Retake only mistakes
  function retakeMistakesOnly() {
    const mistakes = sessionHistory.filter((item) => !item.isCorrect).map((item) => item.question);
    if (mistakes.length === 0) return;
    startQuizSession(selectedTopic, mistakes.length, mistakes, timedMode);
  }

  // Dashboard Stats Calculations
  const totalQuestionsInBank = useMemo(
    () => quizCategories.reduce((acc, cat) => acc + cat.questions.length, 0),
    []
  );

  const overallStats = useMemo(() => {
    let earnedStars = 0;
    let completedTopicsCount = 0;
    let totalAcc = 0;
    let accCount = 0;

    quizCategories.forEach((cat) => {
      const data = savedScores[cat.id];
      if (data) {
        earnedStars += data.bestStars || 0;
        if (data.bestStars > 0) completedTopicsCount++;
        if (data.bestAccuracy !== undefined) {
          totalAcc += data.bestAccuracy;
          accCount++;
        }
      }
    });

    const avgAccuracy = accCount > 0 ? Math.round(totalAcc / accCount) : 0;
    return {
      earnedStars,
      maxStars: quizCategories.length * 3,
      completedTopicsCount,
      totalTopics: quizCategories.length,
      avgAccuracy,
    };
  }, [savedScores]);

  // Filtered categories based on Search & Group
  const filteredCategories = useMemo(() => {
    return quizCategories.filter((topic) => {
      const matchesGroup =
        selectedGroup === "all" || topic.group === selectedGroup;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        topic.title.toLowerCase().includes(query) ||
        topic.titleKhmer.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query) ||
        topic.descriptionKhmer.toLowerCase().includes(query);
      return matchesGroup && matchesSearch;
    });
  }, [selectedGroup, searchQuery]);

  // ==========================================
  // VIEW 1: DASHBOARD & TOPIC SELECTION HUB
  // ==========================================
  if (!selectedTopic) {
    return (
      <div ref={containerRef} className="space-y-6">
        {/* Top Metric Overview Bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={LuStar}
            label="Total Stars"
            value={overallStats.earnedStars}
            note={`/ ${overallStats.maxStars} Max Stars`}
            tone="amber"
          />
          <MetricCard
            icon={LuTarget}
            label="Avg. Accuracy"
            value={`${overallStats.avgAccuracy}%`}
            note="Performance Score"
            tone="emerald"
          />
          <MetricCard
            icon={LuTrophy}
            label="Topics Mastered"
            value={overallStats.completedTopicsCount}
            note={`/ ${overallStats.totalTopics} Categories`}
            tone="sky"
          />
          <MetricCard
            icon={LuBookOpen}
            label="Question Bank"
            value={totalQuestionsInBank}
            note="Questions Total"
            tone="violet"
          />
        </div>

        {/* Sleek Search & Quick Action Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Input
              size="large"
              prefix={<LuSearch className="text-slate-400 mr-1" />}
              placeholder="ស្វែងរកប្រធានបទ (Search Hardware, Safety, Word, Excel, AI...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="rounded-xl border font-medium"
            />
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <Button
              type="primary"
              size="large"
              icon={<LuZap className="text-amber-300" />}
              onClick={() =>
                startQuizSession(
                  {
                    id: "all-mixed",
                    titleKhmer: "សំណួរចម្រុះគ្រប់ប្រធានបទ",
                    title: "Mixed Marathon Sprint",
                    icon: "⚡",
                    accentColor: "#52c41a",
                  },
                  15,
                  null,
                  false
                )
              }
              className="font-bold bg-[#52c41a] hover:!bg-[#46aa16] text-white border-0 rounded-xl shadow-sm hover:shadow"
            >
              Surprise Sprint (១៥ សំណួរ)
            </Button>

            <Tooltip title={isMuted ? "Unmute Audio (M)" : "Mute Audio (M)"}>
              <Button
                shape="circle"
                size="large"
                icon={isMuted ? <LuVolumeX /> : <LuVolume2 />}
                onClick={toggleMute}
                className={`font-bold ${
                  isMuted
                    ? "text-rose-500 border-rose-300 bg-rose-50/50"
                    : "text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                }`}
              />
            </Tooltip>
          </div>
        </div>

        {/* Categories Grid (LearningCategoryCard style) */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((topic, index) => {
            const topicProgress = savedScores[topic.id];
            const stars = topicProgress?.bestStars || 0;
            const accuracy = topicProgress?.bestAccuracy;
            const color = learningCardPalette[index % learningCardPalette.length];
            const visualIcon = getCategoryVisualIcon(topic.id);

            const badgeText =
              stars > 0
                ? "PASSED ✓"
                : `QUIZ 0${index + 1}`;

            const actionLabel = stars > 0 ? "Practice Again" : "Open Skill";

            const footer = (
              <Button
                type="primary"
                onClick={() => {
                  setSessionModalTopic(topic);
                  setSessionQuestionCount(10);
                }}
                className="w-full h-10 flex items-center justify-center gap-2 font-bold text-sm bg-[#52c41a] hover:!bg-[#46aa16] border-0 rounded-xl"
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
                description={topic.descriptionKhmer}
                footer={footer}
                key={topic.id}
                pattern={learningCardPatterns[index % learningCardPatterns.length]}
                subtitle={`DIGITAL LITERACY · LEVEL ${Math.floor(index / 2) + 1}`}
                title={topic.titleKhmer}
                visual={visualIcon}
              >
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{topicProgress?.attempts || (stars > 0 ? 1 : 0)} attempts</span>
                  <span className="text-[#fa8c16] font-extrabold flex items-center gap-1">
                    <LuStar size={13} className={stars > 0 ? "fill-current" : "text-slate-300"} />
                    <span>{stars}/3 stars</span>
                  </span>
                </div>
              </LearningCategoryCard>
            );
          })}
        </div>

        {/* Session Options Modal */}
        <Modal
          open={!!sessionModalTopic}
          onCancel={() => setSessionModalTopic(null)}
          footer={null}
          centered
          className="rounded-2xl overflow-hidden"
          title={
            sessionModalTopic ? (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-3xl p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  {sessionModalTopic.icon}
                </span>
                <div>
                  <div className="font-black text-base text-slate-900 dark:text-white">
                    {sessionModalTopic.titleKhmer}
                  </div>
                  <div className="text-xs text-slate-400 font-semibold">
                    {sessionModalTopic.title} ({sessionModalTopic.questions.length} Questions Pool)
                  </div>
                </div>
              </div>
            ) : null
          }
        >
          {sessionModalTopic && (
            <div className="space-y-4 pt-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 m-0">
                ជ្រើសរើសចំនួនសំណួរ & ទម្រង់លេង (Choose session size & format):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quizSessionLengths.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setSessionQuestionCount(opt.value)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      sessionQuestionCount === opt.value
                        ? "border-[#52c41a] bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-black text-xs sm:text-sm text-slate-800 dark:text-white">
                        {opt.label}
                      </div>
                      {sessionQuestionCount === opt.value && (
                        <LuCheck className="text-[#52c41a] text-base" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {opt.desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mode Switch (Standard vs Timed Rush) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LuTimer className="text-amber-500 text-lg" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-white">
                      Timed Rush Mode (25s per Q)
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Countdown timer adds thrill & tests quick reflexes
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTimedMode((prev) => !prev)}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                    timedMode ? "bg-[#52c41a]" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      timedMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2 flex gap-2.5">
                <Button
                  size="large"
                  onClick={() => setSessionModalTopic(null)}
                  className="flex-1 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<LuPlay />}
                  onClick={() =>
                    startQuizSession(
                      sessionModalTopic,
                      sessionQuestionCount,
                      null,
                      timedMode
                    )
                  }
                  className="flex-1 font-black h-11 bg-[#52c41a] hover:!bg-[#46aa16] border-0"
                >
                  Start Quiz ({sessionQuestionCount} Qs)
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ====================================================
  // VIEW 2: FULL-SCREEN CELEBRATION & RESULTS REVIEW VIEW
  // ====================================================
  if (isCompleted) {
    const total = activeQuestions.length;
    const accuracy = Math.round((score / total) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 60 ? 2 : accuracy >= 40 ? 1 : 0;
    const mistakesCount = total - score;

    const answersReview = sessionHistory.map((item, idx) => ({
      ...item,
      questionNum: idx + 1,
    }));

    const filteredReviewQuestions = answersReview.filter((item) => {
      if (reviewFilter === "mistakes") return !item.isCorrect;
      if (reviewFilter === "correct") return item.isCorrect;
      return true;
    });

    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 overflow-y-auto bg-[#f8fafc] text-slate-900 p-4 sm:p-8 backdrop-blur-md flex flex-col justify-start items-center"
      >
        <div className="w-full max-w-3xl space-y-6 my-auto">
          {/* Victory Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
            {/* Top exit button */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <Tooltip title={isMuted ? "Unmute (M)" : "Mute (M)"}>
                <Button
                  shape="circle"
                  type="text"
                  icon={isMuted ? <LuVolumeX /> : <LuVolume2 />}
                  onClick={toggleMute}
                  className="text-slate-500 hover:text-slate-900"
                />
              </Tooltip>
              <Tooltip title="Toggle Fullscreen (F)">
                <Button
                  shape="circle"
                  type="text"
                  icon={isBrowserFullscreen ? <LuMinimize /> : <LuMaximize />}
                  onClick={toggleBrowserFullscreen}
                  className="text-slate-500 hover:text-slate-900"
                />
              </Tooltip>
            </div>

            <div className="text-5xl sm:text-6xl mb-2 animate-bounce">
              {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "🎉" : "💪"}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white m-0">
              {accuracy >= 80
                ? "Outstanding Mastery! (ពូកែណាស់)"
                : accuracy >= 50
                ? "Great Practice! (ធ្វើបានល្អ)"
                : "Good Effort! Keep Practicing (ហាត់បន្ថែម)"}
            </h2>
            <div className="inline-flex items-center gap-1.5 mt-2 mb-4 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span>ប្រធានបទ៖</span>
              <strong className="text-emerald-600 dark:text-emerald-400">{selectedTopic.titleKhmer}</strong>
              <span className="text-slate-400">({total} សំណួរ)</span>
            </div>

            {/* Stars Reveal */}
            <div className="flex justify-center gap-2.5 text-[#fa8c16] mb-5">
              {[1, 2, 3].map((star) => (
                <LuStar
                  key={star}
                  size={36}
                  className={
                    star <= stars
                      ? "fill-current animate-pulse scale-105 drop-shadow-sm"
                      : "text-slate-200 dark:text-slate-700"
                  }
                />
              ))}
            </div>

            {/* Score & Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mb-5">
              <div className="p-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {score} <span className="text-xs font-bold text-slate-400">/ {total}</span>
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Accuracy</div>
                <div className="text-xl sm:text-2xl font-black text-[#52c41a] mt-0.5">
                  {accuracy}%
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Max Streak</div>
                <div className="text-xl sm:text-2xl font-black text-[#fa8c16] flex items-center justify-center gap-1 mt-0.5">
                  <LuFlame size={18} className="fill-current" />
                  <span>{maxStreak}</span>
                </div>
              </div>
              <div className="p-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">XP Earned</div>
                <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1 mt-0.5">
                  <LuZap size={18} className="fill-current text-amber-500" />
                  <span>+{xp || score * 100}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Clean 2-Row Responsive Layout */}
            <div className="space-y-2.5">
              <div className={`grid gap-2.5 ${mistakesCount > 0 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                {mistakesCount > 0 && (
                  <Button
                    size="large"
                    icon={<LuRefreshCw size={16} />}
                    onClick={retakeMistakesOnly}
                    className="font-bold h-11 bg-amber-500 text-slate-950 border-0 hover:!bg-amber-400 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 text-sm"
                  >
                    <span>ហាត់សំណួរខុស ({mistakesCount})</span>
                    <span className="text-xs opacity-75 font-normal">· Retake</span>
                  </Button>
                )}
                <Button
                  size="large"
                  type="primary"
                  icon={<LuRotateCcw size={16} />}
                  onClick={() =>
                    startQuizSession(selectedTopic, activeQuestions.length, null, timedMode)
                  }
                  className="font-bold h-11 bg-[#52c41a] hover:!bg-[#46aa16] border-0 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 text-sm text-white"
                >
                  <span>លេងម្តងទៀត</span>
                  <span className="text-xs opacity-75 font-normal">· Play Again</span>
                </Button>
              </div>

              <Button
                type="default"
                size="large"
                icon={<LuArrowLeft size={16} />}
                onClick={() => setSelectedTopic(null)}
                className="w-full font-bold h-10 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 flex items-center justify-center gap-1.5 text-sm"
              >
                <span>ត្រឡប់ទៅប្រធានបទ</span>
                <span className="text-xs opacity-75 font-normal">· Back to Topics</span>
              </Button>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white m-0">
                ផ្ទៀងផ្ទាត់ចម្លើយ & ការពន្យល់ (Question Review)
              </h4>

              {/* Filter Tabs */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setReviewFilter("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    reviewFilter === "all"
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                  }`}
                >
                  All ({answersReview.length})
                </button>
                <button
                  onClick={() => setReviewFilter("mistakes")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    reviewFilter === "mistakes"
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-700 hover:border-rose-300"
                  }`}
                >
                  Mistakes ({mistakesCount})
                </button>
                <button
                  onClick={() => setReviewFilter("correct")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    reviewFilter === "correct"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                  }`}
                >
                  Correct ({answersReview.length - mistakesCount})
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {filteredReviewQuestions.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border transition-all shadow-sm ${
                    item.isCorrect
                      ? "border-emerald-300/80 dark:border-emerald-800/80"
                      : "border-rose-300/80 dark:border-rose-800/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                          item.isCorrect
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                            : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                        }`}
                      >
                        {item.questionNum}
                      </span>
                      <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
                        {item.question.questionKhmer}
                      </h5>
                    </div>

                    <Tag color={item.isCorrect ? "success" : "error"} className="rounded-lg font-bold">
                      {item.isCorrect ? "Correct ✓" : "Mistake ✗"}
                    </Tag>
                  </div>

                  <p className="text-xs text-slate-400 m-0 mb-3 pl-8">
                    {item.question.question}
                  </p>

                  <div className="pl-8 space-y-2 text-xs">
                    {!item.isCorrect && item.selectedOptionIndex !== null && (
                      (() => {
                        const { km, en } = parseBilingualOption(item.question.options[item.selectedOptionIndex]);
                        return (
                          <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                            <LuX size={15} className="flex-shrink-0 mt-0.5" />
                            <div>
                              <span>ចម្លើយរបស់អ្នក (Your Answer): </span>
                              <strong className="text-rose-700 dark:text-rose-300">{km}</strong>
                              {en && <div className="text-[11px] text-slate-400 font-normal">{en}</div>}
                            </div>
                          </div>
                        );
                      })()
                    )}
                    {(() => {
                      const { km, en } = parseBilingualOption(item.question.options[item.question.answerIndex]);
                      return (
                        <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <LuCheck size={15} className="flex-shrink-0 mt-0.5" />
                          <div>
                            <span>ចម្លើយត្រឹមត្រូវ (Correct Answer): </span>
                            <strong className="text-emerald-700 dark:text-emerald-300">{km}</strong>
                            {en && <div className="text-[11px] text-slate-400 font-normal">{en}</div>}
                          </div>
                        </div>
                      );
                    })()}

                    {item.question.explanation && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 leading-relaxed">
                        <span className="font-bold text-amber-600 dark:text-amber-400 mr-1">💡 Note:</span>
                        {item.question.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // VIEW 3: IN-GAME ACTIVE FULLSCREEN ARENA (White Theme)
  // ====================================================
  const question = activeQuestions[currentQuestionIndex];
  const progressPercent = Math.round(
    ((currentQuestionIndex + (isAnswered ? 1 : 0)) / activeQuestions.length) * 100
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#f8fafc] text-slate-900 p-3 sm:p-6 backdrop-blur-md flex flex-col justify-between"
    >
      {/* 1. TOP GAME HUD */}
      <div className="w-full max-w-3xl mx-auto space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          {/* Left: Exit button & Topic name */}
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="text"
              icon={<LuArrowLeft />}
              onClick={() => setShowQuitConfirm(true)}
              className="text-slate-600 hover:text-slate-900 font-bold p-2 flex items-center justify-center rounded-xl hover:bg-slate-100"
            />
            <div className="flex items-center gap-2 truncate">
              <span className="text-xl sm:text-2xl p-1 bg-slate-100 rounded-xl">{selectedTopic.icon}</span>
              <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {selectedTopic.titleKhmer}
              </span>
            </div>
          </div>

          {/* Center: Live Timer & Streak */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {timedMode ? (
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                  timeLeft <= 5
                    ? "bg-rose-50 text-rose-600 border-rose-300 animate-pulse"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                <LuTimer size={14} />
                <span>{timeLeft}s</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <LuClock size={13} />
                <span>
                  {Math.floor(sessionSeconds / 60)}:
                  {String(sessionSeconds % 60).padStart(2, "0")}
                </span>
              </div>
            )}

            {/* Streak Combo Badge */}
            {streak >= 2 && (
              <div className="snp-quiz-fire-pulse px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 flex items-center gap-1 shadow-sm">
                <LuFlame className="fill-current" />
                <span>
                  {streak >= 5 ? "x5 GODLIKE!" : streak >= 3 ? "x3 FIRE!" : `${streak} Streak`}
                </span>
              </div>
            )}
          </div>

          {/* Right: Sound, Fullscreen & Question Count */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-mono font-bold text-emerald-700">
              {currentQuestionIndex + 1}/{activeQuestions.length}
            </span>

            <Tooltip title={isMuted ? "Unmute (M)" : "Mute (M)"}>
              <Button
                shape="circle"
                type="text"
                size="small"
                icon={isMuted ? <LuVolumeX /> : <LuVolume2 />}
                onClick={toggleMute}
                className="text-slate-500 hover:text-slate-900"
              />
            </Tooltip>

            <Tooltip title="Fullscreen (F)">
              <Button
                shape="circle"
                type="text"
                size="small"
                icon={isBrowserFullscreen ? <LuMinimize /> : <LuMaximize />}
                onClick={toggleBrowserFullscreen}
                className="text-slate-500 hover:text-slate-900"
              />
            </Tooltip>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress
          percent={progressPercent}
          showInfo={false}
          strokeColor={{
            "0%": "#52c41a",
            "100%": "#fa8c16",
          }}
          railColor="#e2e8f0"
          size={["100%", 7]}
          className="m-0"
        />
      </div>

      {/* 2. MAIN QUESTION ARENA */}
      <div className="w-full max-w-2xl mx-auto my-auto py-4 space-y-4">
        {/* Floating XP Popup Animation */}
        {floatingXp && (
          <div
            key={floatingXp.key}
            className="fixed top-20 right-8 pointer-events-none z-50"
            style={{ animation: "snp-quiz-float-xp 1.2s forwards" }}
          >
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-xl flex items-center gap-1.5">
              <LuZap className="fill-current" />
              <span>{floatingXp.text}</span>
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl relative">
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-block px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide">
                Question {currentQuestionIndex + 1} of {activeQuestions.length}
              </span>
              <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                Shortcuts: ចុច 1, 2, 3, 4 ឬ A, B, C, D
              </span>
            </div>

            <h3 className="text-lg sm:text-2xl font-black text-slate-900 m-0 leading-relaxed">
              {question.questionKhmer}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 m-0 font-medium">
              {question.question}
            </p>
          </div>

          {/* Options Grid */}
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = index === question.answerIndex;
              const keyLabels = ["1", "2", "3", "4"];
              const { km, en } = parseBilingualOption(option);

              let optionStyle =
                "border border-slate-200 bg-white text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 shadow-sm hover:shadow-md";
              let animationClass = "";

              if (isAnswered) {
                if (isCorrect) {
                  optionStyle =
                    "border-2 border-emerald-500 bg-emerald-50/90 text-emerald-950 font-bold shadow-md";
                  animationClass = "snp-quiz-pop";
                } else if (isSelected && !isCorrect) {
                  optionStyle =
                    "border-2 border-rose-500 bg-rose-50/90 text-rose-950 font-bold shadow-md";
                  animationClass = "snp-quiz-shake";
                } else {
                  optionStyle = "border border-slate-100 bg-slate-50/60 opacity-50 text-slate-400";
                }
              }

              return (
                <button
                  key={index}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(index)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${optionStyle} ${animationClass}`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center flex-shrink-0 border mt-0.5 sm:mt-0 ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      {keyLabels[index]}
                    </span>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-bold text-sm sm:text-base leading-snug text-slate-900 dark:text-slate-100">
                        {km || option}
                      </span>
                      {en && (
                        <span className="text-[11px] sm:text-xs text-slate-400 font-normal mt-0.5 leading-tight">
                          {en}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAnswered && isCorrect && (
                    <LuCheck className="text-emerald-600 text-xl flex-shrink-0 ml-2" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <LuX className="text-rose-600 text-xl flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Button Card */}
          {isAnswered && (
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 uppercase tracking-wider mb-1">
                  <LuSparkles />
                  <span>Did You Know? (ការពន្យល់ & គន្លឹះ)</span>
                </div>
                <p className="m-0 font-normal text-slate-700">{question.explanation}</p>
              </div>

              <Button
                type="primary"
                size="large"
                onClick={handleNextQuestion}
                className="w-full font-bold h-12 flex items-center justify-center gap-2 text-base bg-[#52c41a] hover:!bg-[#46aa16] border-0 shadow-md hover:shadow-lg transition-all"
              >
                <span>
                  {currentQuestionIndex < activeQuestions.length - 1
                    ? "Next Question (សំណួរបន្ទាប់) [Enter ↵]"
                    : "View Results (មើលលទ្ធផល) [Enter ↵]"}
                </span>
                <LuArrowRight />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM FOOTER HINTS */}
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between text-[11px] font-bold text-slate-400 px-2 flex-shrink-0">
        <div>
          SNP Typing Digital Lab · <span className="text-slate-600">Press [F] for Fullscreen</span>
        </div>
        <div>
          Press <span className="text-slate-600">[Esc]</span> to Pause/Exit · <span className="text-slate-600">[M]</span> to Mute
        </div>
      </div>

      {/* Quit Confirmation Modal */}
      <Modal
        open={showQuitConfirm}
        onCancel={() => setShowQuitConfirm(false)}
        footer={null}
        centered
        title="Leave Quiz Session? (ចាកចេញពីវគ្គល្បែង?)"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-600 m-0">
            តើអ្នកចង់ចាកចេញពីការប្រកួតនេះមែនទេ? ពិន្ទុបច្ចុប្បន្ននឹងមិនត្រូវបានរក្សាទុកពេញលេញឡើយ។ (Are you sure you want to quit?)
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              size="large"
              onClick={() => setShowQuitConfirm(false)}
              className="flex-1 font-bold"
            >
              Keep Playing (បន្តលេង)
            </Button>
            <Button
              danger
              type="primary"
              size="large"
              onClick={() => {
                setShowQuitConfirm(false);
                setSelectedTopic(null);
              }}
              className="flex-1 font-black"
            >
              Exit to Hub (ចាកចេញ)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
