import { memo, useEffect, useRef, useState } from "react";
import { Badge, Space, Tag } from "antd";
import { LuFlame, LuSparkles, LuStar, LuTrophy } from "react-icons/lu";

const copy = {
  en: {
    ready: "Ready, typing hero? Start with the glowing key!",
    steady: "Nice rhythm—keep your eyes on the next key!",
    five: "Five in a row! Super focus!",
    ten: "Super streak! You are flying!",
    error: "Tiny wobble—fix it and keep going!",
    complete: "Mission complete! Amazing focus!",
    streak: "Streak",
    stars: "Stars",
  },
  km: {
    ready: "ត្រៀមខ្លួនហើយឬនៅ? ចាប់ផ្ដើមពីគ្រាប់ចុចភ្លឺ!",
    steady: "ល្អណាស់! បន្តវាយតាមចង្វាក់រលូន។",
    five: "ត្រូវ ៥ ដងជាប់គ្នា! អស្ចារ្យណាស់!",
    ten: "ពូកែណាស់! កំពុងហោះទៅមុខយ៉ាងលឿន!",
    error: "មិនអីទេ! កែបន្តិច ហើយបន្តទៅទៀត។",
    complete: "បេសកកម្មបានបញ្ចប់! ពូកែណាស់!",
    streak: "ជាប់គ្នា",
    stars: "ផ្កាយ",
  },
};

function StatusIcon({ hasError, isComplete, streak }) {
  if (isComplete) return <LuTrophy className="text-amber-500 animate-bounce shrink-0" size={18} />;
  if (hasError) return <LuSparkles className="text-rose-500 shrink-0" size={18} />;
  if (streak >= 10) return <LuFlame className="text-orange-500 animate-pulse shrink-0" size={18} />;
  return <LuSparkles className="text-emerald-500 shrink-0" size={18} />;
}

function TypingAdventureHud({ engine, language, compact = false, inline = false }) {
  const words = copy[language === "km" ? "km" : "en"];
  const previous = useRef({ currentIndex: 0, errors: 0, resetVersion: engine.resetVersion });
  const streakRef = useRef(0);
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState(words.ready);
  const progress = engine.targetSegments.length
    ? (engine.currentIndex / engine.targetSegments.length) * 100
    : 0;
  const earnedStars = [25, 60, 90].filter((milestone) => progress >= milestone).length;

  useEffect(() => {
    const prior = previous.current;
    if (prior.resetVersion !== engine.resetVersion) {
      streakRef.current = 0;
      setStreak(0);
      setMessage(words.ready);
    } else if (engine.isComplete) {
      setMessage(words.complete);
    } else if (engine.errors > prior.errors) {
      streakRef.current = 0;
      setStreak(0);
      setMessage(words.error);
    } else if (engine.currentIndex > prior.currentIndex) {
      const next = streakRef.current + (engine.currentIndex - prior.currentIndex);
      streakRef.current = next;
      setStreak(next);
      setMessage(next >= 10 ? words.ten : next >= 5 ? words.five : words.steady);
    }
    previous.current = {
      currentIndex: engine.currentIndex,
      errors: engine.errors,
      resetVersion: engine.resetVersion,
    };
  }, [engine.currentIndex, engine.errors, engine.isComplete, engine.resetVersion, words]);

  if (inline) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 max-w-[480px] w-full justify-between overflow-hidden shadow-xs">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <StatusIcon hasError={engine.hasCurrentError} isComplete={engine.isComplete} streak={streak} />
          <p className="m-0 truncate text-xs font-bold text-slate-700 dark:text-slate-300">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 rounded-lg bg-orange-500/10 px-2 py-0.5 text-[11px] font-black text-[#fa8c16]">
            <LuFlame size={12} fill={streak ? "currentColor" : "none"} />
            <span>
              {streak} {words.streak}
            </span>
          </div>

          <div className="flex items-center gap-0.5 rounded-lg bg-purple-500/10 px-2 py-0.5 text-[11px] font-black text-[#722ed1]">
            <LuSparkles size={12} />
            <span className="flex gap-0.5 ml-0.5">
              {[0, 1, 2].map((star) => (
                <LuStar
                  key={star}
                  size={11}
                  className={star < earnedStars ? "text-[#fa8c16]" : "text-slate-300 dark:text-slate-600"}
                  fill={star < earnedStars ? "currentColor" : "none"}
                />
              ))}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:px-4 shadow-sm ${compact ? "py-1.5" : "py-3"}`}>
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <StatusIcon hasError={engine.hasCurrentError} isComplete={engine.isComplete} streak={streak} />
        <p className="m-0 truncate text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          {message}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 rounded-xl bg-orange-500/10 px-2.5 py-1 text-xs font-black text-[#fa8c16]">
          <LuFlame size={14} fill={streak ? "currentColor" : "none"} />
          <span>
            {streak} {words.streak}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-purple-500/10 px-2.5 py-1 text-xs font-black text-[#722ed1]">
          <LuSparkles size={14} />
          <span className="hidden sm:inline">{words.stars}</span>
          <span className="flex gap-0.5 ml-1">
            {[0, 1, 2].map((star) => (
              <LuStar
                key={star}
                size={13}
                className={star < earnedStars ? "text-[#fa8c16]" : "text-slate-300 dark:text-slate-700"}
                fill={star < earnedStars ? "currentColor" : "none"}
              />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(TypingAdventureHud);
