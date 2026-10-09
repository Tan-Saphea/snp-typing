import { useState, useMemo, useEffect, useRef } from "react";
import { Button, Input, Modal, Progress, Tag, Tooltip } from "antd";
import {
  LuArrowLeft,
  LuArrowRight,
  LuBookOpen,
  LuCheck,
  LuClock,
  LuCpu,
  LuFlame,
  LuGamepad2,
  LuHardDrive,
  LuHeadphones,
  LuInfo,
  LuKeyboard,
  LuMaximize,
  LuMic,
  LuMinimize,
  LuMonitor,
  LuMouse,
  LuPrinter,
  LuRadio,
  LuRefreshCw,
  LuRotateCcw,
  LuSearch,
  LuShieldCheck,
  LuSparkles,
  LuSpeaker,
  LuStar,
  LuTimer,
  LuTrophy,
  LuVideo,
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
  hardwareCategories,
  hardwareDevices,
} from "../data/hardwareExplorerData.js";
import { hardwareGameChallenges } from "../data/hardwareQuizChallenges.js";
import { shuffleArray } from "../data/quiz/index.js";
import MouseMasterGame from "./MouseMasterGame.jsx";

// Helper to pick a Lucide outline icon for each device
function getDeviceVisualIcon(id) {
  const iconProps = { className: "text-5xl text-white drop-shadow-md" };
  switch (id) {
    case "keyboard":
      return <LuKeyboard {...iconProps} />;
    case "mouse":
      return <LuMouse {...iconProps} />;
    case "microphone":
      return <LuMic {...iconProps} />;
    case "webcam":
      return <LuVideo {...iconProps} />;
    case "gamepad":
      return <LuGamepad2 {...iconProps} />;
    case "monitor":
      return <LuMonitor {...iconProps} />;
    case "speaker":
      return <LuSpeaker {...iconProps} />;
    case "headphones":
      return <LuHeadphones {...iconProps} />;
    case "printer":
      return <LuPrinter {...iconProps} />;
    case "cpu":
      return <LuCpu {...iconProps} />;
    case "ram":
      return <LuZap {...iconProps} />;
    case "storage-ssd":
      return <LuHardDrive {...iconProps} />;
    case "gpu":
      return <LuSparkles {...iconProps} />;
    case "motherboard":
      return <LuCpu {...iconProps} />;
    case "usb-flash":
      return <LuHardDrive {...iconProps} />;
    case "wifi-router":
      return <LuRadio {...iconProps} />;
    default:
      return <LuMonitor {...iconProps} />;
  }
}

// Synthesized audio feedback
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
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.24); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.setValueAtTime(164.81, now + 0.12); // E3
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "victory") {
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.15, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
    }
  } catch {
    // Ignore audio context errors
  }
}

export default function HardwareExplorer() {
  const containerRef = useRef(null);

  // Hub States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDevice, setActiveDevice] = useState(null);
  const [exploredDeviceIds, setExploredDeviceIds] = useState(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [mouseGameActive, setMouseGameActive] = useState(false);

  // Game States
  const [gameActive, setGameActive] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [floatingXp, setFloatingXp] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Filtered devices for explorer cards
  const filteredDevices = useMemo(() => {
    return hardwareDevices.filter((dev) => {
      const matchesCat =
        selectedCategory === "all" || dev.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        dev.nameEnglish.toLowerCase().includes(query) ||
        dev.nameKhmer.toLowerCase().includes(query) ||
        dev.roleSummary.toLowerCase().includes(query) ||
        dev.whatItDoes.toLowerCase().includes(query);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Start Hardware Game
  function startGameSession() {
    playSound("click", isMuted);
    // Shuffle challenges AND shuffle the 4 options inside each challenge
    const shuffled = shuffleArray(hardwareGameChallenges).map((challenge) => ({
      ...challenge,
      options: shuffleArray(challenge.options),
    }));
    setActiveChallenges(shuffled);
    setCurrentChallengeIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setGameHistory([]);
    setIsGameCompleted(false);
    setGameActive(true);
  }

  function handleSelectOption(index) {
    if (isAnswered) return;

    const currentChallenge = activeChallenges[currentChallengeIndex];
    const isCorrect = currentChallenge.options[index]?.isCorrect;
    setSelectedOptionIndex(index);
    setIsAnswered(true);

    if (isCorrect) {
      const nextScore = score + 1;
      const nextStreak = streak + 1;
      setScore(nextScore);
      setStreak(nextStreak);
      if (nextStreak > maxStreak) setMaxStreak(nextStreak);

      const xpGain = 100 + nextStreak * 20;
      setFloatingXp({ text: `+${xpGain} XP!`, key: Date.now() });
      playSound("correct", isMuted);
    } else {
      setStreak(0);
      playSound("wrong", isMuted);
    }

    setGameHistory((prev) => [
      ...prev,
      {
        challenge: currentChallenge,
        selectedOptionIndex: index,
        isCorrect,
      },
    ]);
  }

  function handleNextChallenge() {
    if (currentChallengeIndex < activeChallenges.length - 1) {
      setCurrentChallengeIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
    } else {
      playSound("victory", isMuted);
      setIsGameCompleted(true);
    }
  }

  function toggleBrowserFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsBrowserFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsBrowserFullscreen(false);
    }
  }

  function handleOpenDevice(device) {
    playSound("click", isMuted);
    setActiveDevice(device);
    setExploredDeviceIds((prev) => new Set([...prev, device.id]));
  }

  // Keyboard shortcut listener during active game
  useEffect(() => {
    if (!gameActive || isGameCompleted) return;

    function handleKeyDown(e) {
      if (["1", "2", "3", "4"].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (!isAnswered) handleSelectOption(idx);
      } else if (e.key === "Enter" && isAnswered) {
        handleNextChallenge();
      } else if (e.key.toLowerCase() === "m") {
        setIsMuted((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameActive, isGameCompleted, isAnswered, currentChallengeIndex]);

  // ==========================================
  // VIEW 1: GAME COMPLETED CELEBRATION
  // ==========================================
  if (gameActive && isGameCompleted) {
    const total = activeChallenges.length;
    const accuracy = Math.round((score / total) * 100);
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;

    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 overflow-y-auto bg-[#f8fafc] text-slate-900 p-4 sm:p-8 backdrop-blur-md flex flex-col justify-start items-center"
      >
        <div className="w-full max-w-2xl space-y-6 my-auto">
          {/* Victory Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
            <div className="text-6xl sm:text-7xl mb-2 animate-bounce">
              {accuracy >= 80 ? "🏆" : "🎉"}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white m-0">
              {accuracy >= 80
                ? "Hardware Master! (ពូកែណាស់)"
                : "Great Detective! (ស្គាល់គ្រឿងបានល្អ)"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5">
              បានបញ្ចប់ការស្វែងយល់គ្រឿងកុំព្យូទ័រ ({total} សំណួរ)
            </p>

            {/* Stars Reveal */}
            <div className="flex justify-center gap-3 text-[#fa8c16] mb-6">
              {[1, 2, 3].map((star) => (
                <LuStar
                  key={star}
                  size={42}
                  className={
                    star <= stars
                      ? "fill-current animate-pulse scale-110 drop-shadow-md"
                      : "text-slate-200 dark:text-slate-700"
                  }
                />
              ))}
            </div>

            {/* Score & Stats Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mb-6">
              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Score</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {score} <span className="text-sm font-bold text-slate-400">/ {total}</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Accuracy</div>
                <div className="text-2xl font-black text-[#52c41a] mt-0.5">
                  {accuracy}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Max Streak</div>
                <div className="text-2xl font-black text-[#fa8c16] flex items-center justify-center gap-1 mt-0.5">
                  <LuFlame size={20} className="fill-current" />
                  <span>{maxStreak}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="large"
                icon={<LuRotateCcw />}
                onClick={startGameSession}
                className="flex-1 font-bold h-12 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-slate-400 shadow-sm hover:shadow transition-all"
              >
                Play Again (លេងម្តងទៀត)
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<LuArrowLeft />}
                onClick={() => setGameActive(false)}
                className="flex-1 font-bold h-12 bg-[#52c41a] hover:!bg-[#46aa16] border-0 shadow-md hover:shadow-lg transition-all"
              >
                Back to Cards (មើលកាតគ្រឿងទាំងអស់)
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE HARDWARE DETECTIVE GAME
  // ==========================================
  if (gameActive) {
    const challenge = activeChallenges[currentChallengeIndex];
    const progressPercent = Math.round(
      ((currentChallengeIndex + (isAnswered ? 1 : 0)) / activeChallenges.length) * 100
    );

    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 overflow-y-auto bg-[#f8fafc] text-slate-900 p-3 sm:p-6 backdrop-blur-md flex flex-col justify-between"
      >
        {/* 1. TOP GAME HUD */}
        <div className="w-full max-w-2xl mx-auto space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                type="text"
                icon={<LuArrowLeft />}
                onClick={() => setGameActive(false)}
                className="text-slate-600 hover:text-slate-900 font-bold p-2 flex items-center justify-center rounded-xl hover:bg-slate-100"
              />
              <div className="flex items-center gap-2 truncate">
                <span className="text-xl sm:text-2xl p-1 bg-emerald-50 rounded-xl">🎮</span>
                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                  Hardware Detective Game
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {streak >= 2 && (
                <div className="snp-quiz-fire-pulse px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 flex items-center gap-1 shadow-sm">
                  <LuFlame className="fill-current" />
                  <span>{streak} Streak</span>
                </div>
              )}

              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-mono font-bold text-emerald-700">
                {currentChallengeIndex + 1}/{activeChallenges.length}
              </span>

              <Tooltip title={isMuted ? "Unmute (M)" : "Mute (M)"}>
                <Button
                  shape="circle"
                  type="text"
                  size="small"
                  icon={isMuted ? <LuVolumeX /> : <LuVolume2 />}
                  onClick={() => setIsMuted(!isMuted)}
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

          <Progress
            percent={progressPercent}
            showInfo={false}
            strokeColor={{ "0%": "#52c41a", "100%": "#fa8c16" }}
            railColor="#e2e8f0"
            size={["100%", 7]}
            className="m-0"
          />
        </div>

        {/* 2. MAIN CLUE & 4 OPTIONS ARENA */}
        <div className="w-full max-w-2xl mx-auto my-auto py-4 space-y-4">
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

          {/* Clue Question Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl relative text-center">
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 m-0 leading-relaxed">
              "{challenge.clueKhmer}"
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0 font-medium">
              {challenge.clueEnglish}
            </p>

            {/* 4 Interactive Visual Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {challenge.options.map((opt, idx) => {
                const isSelected = selectedOptionIndex === idx;
                const isCorrect = opt.isCorrect;
                const keyLabels = ["1", "2", "3", "4"];

                let btnStyle =
                  "border border-slate-200 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-800 shadow-sm hover:shadow-md";

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle =
                      "border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-md scale-102";
                  } else if (isSelected && !isCorrect) {
                    btnStyle =
                      "border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-md";
                  } else {
                    btnStyle = "border border-slate-100 bg-slate-50/50 opacity-40 text-slate-400";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-4 rounded-2xl transition-all flex items-center justify-between text-left cursor-pointer ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-1 bg-white rounded-xl shadow-xs">
                        {opt.icon}
                      </span>
                      <div className="flex flex-col text-left min-w-0">
                        <div className="font-bold text-sm text-slate-900 leading-snug">
                          {(() => {
                            const match = opt.name.match(/^(.*?)\s*\((.*?)\)$/);
                            if (match) {
                              // If format is "CPU (ខួរក្បាលកណ្តាល)", Khmer is in parenthesis or first
                              const isKhmerFirst = /^[\u1780-\u17FF]/.test(match[1]);
                              return isKhmerFirst ? match[1] : match[2];
                            }
                            return opt.name;
                          })()}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {(() => {
                            const match = opt.name.match(/^(.*?)\s*\((.*?)\)$/);
                            if (match) {
                              const isKhmerFirst = /^[\u1780-\u17FF]/.test(match[1]);
                              return isKhmerFirst ? match[2] : match[1];
                            }
                            return `ចុចគ្រាប់ចុច [${keyLabels[idx]}]`;
                          })()}
                        </div>
                      </div>
                    </div>

                    {isAnswered && isCorrect && (
                      <LuCheck className="text-emerald-600 text-2xl flex-shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <LuX className="text-rose-600 text-2xl flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Next Button */}
            {isAnswered && (
              <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 animate-fadeIn text-left">
                <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 uppercase tracking-wider mb-1">
                    <LuSparkles />
                    <span>ការពន្យល់ (Fun Fact & Explanation):</span>
                  </div>
                  <p className="m-0 font-normal text-slate-700">{challenge.funExplanation}</p>
                </div>

                <Button
                  type="primary"
                  size="large"
                  onClick={handleNextChallenge}
                  className="w-full font-bold h-12 flex items-center justify-center gap-2 text-base bg-[#52c41a] hover:!bg-[#46aa16] border-0 shadow-md hover:shadow-lg transition-all"
                >
                  <span>
                    {currentChallengeIndex < activeChallenges.length - 1
                      ? "Next Clue (តម្រុយបន្ទាប់) [Enter ↵]"
                      : "View Results (មើលពិន្ទុ) [Enter ↵]"}
                  </span>
                  <LuArrowRight />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2.5: MOUSE MASTER GAME FOR KIDS
  // ==========================================
  if (mouseGameActive) {
    return <MouseMasterGame onClose={() => setMouseGameActive(false)} />;
  }

  // ==========================================
  // VIEW 3: VISUAL HARDWARE CARDS HUB
  // ==========================================
  return (
    <div className="space-y-6">
      {/* 1. TOP METRIC STATS OVERVIEW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={LuMonitor}
          label="Computer Parts"
          value={hardwareDevices.length}
          note="Total Components"
          tone="emerald"
        />
        <MetricCard
          icon={LuCheck}
          label="Parts Explored"
          value={exploredDeviceIds.size}
          note={`/ ${hardwareDevices.length} Explored`}
          tone="amber"
        />
        <MetricCard
          icon={LuKeyboard}
          label="Input & Output"
          value="9 Parts"
          note="Controls & Displays"
          tone="sky"
        />
        <MetricCard
          icon={LuCpu}
          label="Core & Brain"
          value="5 Parts"
          note="CPU, RAM, GPU, SSD"
          tone="violet"
        />
      </div>

      {/* 2. SEARCH & PLAY GAME ACTION TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            size="large"
            prefix={<LuSearch className="text-slate-400 mr-1" />}
            placeholder="ស្វែងរកគ្រឿងកុំព្យូទ័រ (Search Keyboard, CPU, Mouse, Screen...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className="rounded-xl border font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {/* Mouse Master Game Button */}
          <Button
            size="large"
            icon={<span className="text-base">🖱️</span>}
            onClick={() => setMouseGameActive(true)}
            className="font-bold border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl h-10 px-4 flex items-center gap-1.5 shadow-xs"
          >
            <span>Mouse Master (ហាត់ប្រើ Mouse)</span>
          </Button>

          {/* Main Game Play Button */}
          <Button
            type="primary"
            size="large"
            icon={<LuGamepad2 className="text-amber-300" />}
            onClick={startGameSession}
            className="font-bold bg-[#52c41a] hover:!bg-[#46aa16] text-white border-0 rounded-xl shadow-sm hover:shadow h-10 px-5"
          >
            Play Hardware Game (🎮 លេងហ្គេមទាយគ្រឿង)
          </Button>

          <Tooltip title={isMuted ? "Unmute Audio" : "Mute Audio"}>
            <Button
              shape="circle"
              size="large"
              icon={isMuted ? <LuVolumeX /> : <LuVolume2 />}
              onClick={() => setIsMuted(!isMuted)}
              className={`font-bold ${
                isMuted
                  ? "text-rose-500 border-rose-300 bg-rose-50/50"
                  : "text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
              }`}
            />
          </Tooltip>
        </div>
      </div>

      {/* 3. HARDWARE CATEGORY CARDS GRID */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredDevices.map((device, index) => {
          const isExplored = exploredDeviceIds.has(device.id);
          const color = learningCardPalette[index % learningCardPalette.length];
          const visualIcon = getDeviceVisualIcon(device.id);

          const footer = (
            <Button
              type="primary"
              onClick={() => handleOpenDevice(device)}
              className={`w-full h-10 flex items-center justify-center gap-2 font-bold text-sm border-0 rounded-xl shadow-sm hover:shadow transition-all ${
                isExplored
                  ? "bg-slate-800 hover:!bg-slate-900 text-white"
                  : "bg-[#52c41a] hover:!bg-[#46aa16] text-white"
              }`}
            >
              <span>{isExplored ? "Review Part (មើលឡើងវិញ)" : "Explore Part (ស្វែងយល់)"}</span>
              <LuArrowRight size={15} />
            </Button>
          );

          return (
            <LearningCategoryCard
              accent={device.accentColor || color.accent}
              badge={isExplored ? "EXPLORED ✓" : device.badge}
              deep={device.deepColor || color.deep}
              description={device.roleSummary}
              footer={footer}
              key={device.id}
              pattern={learningCardPatterns[index % learningCardPatterns.length]}
              subtitle={device.nameEnglish}
              title={device.nameKhmer}
              visual={visualIcon}
            >
              {/* Kid-friendly Metaphor Analogy Pill */}
              <div className="mt-2 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                <span className="font-bold mr-1">💡 ងាយយល់៖</span>
                {device.analogy}
              </div>
            </LearningCategoryCard>
          );
        })}
      </div>

      {/* 4. INTERACTIVE DEVICE DETAIL MODAL (Redesigned Bento Style) */}
      <Modal
        open={!!activeDevice}
        onCancel={() => setActiveDevice(null)}
        footer={null}
        width={680}
        centered
        className="rounded-3xl overflow-hidden p-0"
        styles={{
          body: { padding: 0, overflow: "hidden", borderRadius: "1.5rem" },
          content: { padding: 0, borderRadius: "1.5rem", overflow: "hidden" },
        }}
      >
        {activeDevice && (
          <div className="flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
            {/* Top Visual Hero Header */}
            <div
              className="relative p-6 sm:p-8 text-white overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${activeDevice.accentColor} 0%, ${activeDevice.deepColor} 100%)`,
              }}
            >
              {/* Subtle background glow */}
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-4xl sm:text-5xl shadow-lg flex-shrink-0">
                    {activeDevice.icon}
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider text-white mb-1">
                      {activeDevice.categoryLabel}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white m-0 leading-tight">
                      {activeDevice.nameKhmer}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/80 m-0 font-semibold mt-0.5">
                      {activeDevice.nameEnglish}
                    </p>
                  </div>
                </div>

                <Button
                  shape="circle"
                  type="text"
                  icon={<LuX size={18} />}
                  onClick={() => setActiveDevice(null)}
                  className="text-white hover:!bg-white/20 border-0 flex-shrink-0"
                />
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* 1. Kid-friendly Life Analogy Card */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 p-1.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl">
                  💡
                </span>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-0.5">
                    ប្រៀបធៀបក្នុងជីវិតរស់នៅ (Simple Analogy)
                  </div>
                  <div className="text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-100 leading-snug">
                    {activeDevice.analogy}
                  </div>
                </div>
              </div>

              {/* 2. What It Does & How It Works */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LuInfo size={15} className="text-[#52c41a]" />
                  <span>តើឧបករណ៍នេះធ្វើការដូចម្តេច? (What It Does)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed m-0 font-medium">
                  {activeDevice.whatItDoes}
                </p>
              </div>

              {/* 3. Bento 2-Column Grid: Fun Fact & Care Tip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Fun Fact */}
                <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 space-y-1">
                  <div className="font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <LuSparkles size={15} className="text-[#fa8c16]" />
                    <span>តើអ្នកដឹងទេ? (Fun Fact)</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed m-0">
                    {activeDevice.funFact}
                  </p>
                </div>

                {/* Care & Safety */}
                <div className="p-4 rounded-2xl bg-sky-50/90 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/40 space-y-1">
                  <div className="font-extrabold text-sky-800 dark:text-sky-400 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <LuShieldCheck size={15} className="text-blue-500" />
                    <span>គន្លឹះថែទាំ (Care & Safety)</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed m-0">
                    {activeDevice.careTips}
                  </p>
                </div>
              </div>

              {/* 4. Bottom Action Button */}
              <div className="pt-2">
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setActiveDevice(null)}
                  className="w-full font-bold h-12 text-base bg-[#52c41a] hover:!bg-[#46aa16] text-white border-0 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  យល់ច្បាស់ហើយ! (Got It!)
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
