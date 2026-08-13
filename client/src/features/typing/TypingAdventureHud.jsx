import { useEffect, useRef, useState } from "react";
import { LuFlame, LuSparkles, LuStar } from "react-icons/lu";

const copy = {
  en: {
    ready: "Ready, typing hero? Start with the glowing key!",
    steady: "Nice rhythm—keep your eyes on the next key!",
    five: "Five in a row! Your tiger is cheering!",
    ten: "Super streak! You are flying!",
    error: "Tiny wobble—fix it and keep going!",
    complete: "Mission complete! Amazing focus!",
    streak: "Streak",
    stars: "Mission stars",
  },
  km: {
    ready: "ត្រៀមខ្លួនហើយឬនៅ? ចាប់ផ្ដើមពីគ្រាប់ចុចភ្លឺ!",
    steady: "ល្អណាស់! បន្តវាយតាមចង្វាក់។",
    five: "ត្រូវ ៥ ដងជាប់គ្នា! ខ្លាតូចកំពុងអបអរ!",
    ten: "ពូកែណាស់! អ្នកកំពុងហោះហើយ!",
    error: "មិនអីទេ! កែបន្តិច ហើយបន្តវាយទៀត។",
    complete: "បេសកកម្មបានបញ្ចប់! ពូកែណាស់!",
    streak: "វាយត្រូវជាប់គ្នា",
    stars: "ផ្កាយបេសកកម្ម",
  },
};

export default function TypingAdventureHud({ engine, language, compact = false }) {
  const words = copy[language === "km" ? "km" : "en"];
  const previous = useRef({ currentIndex: 0, errors: 0, resetVersion: engine.resetVersion });
  const streakRef = useRef(0);
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState(words.ready);
  const progress = engine.targetSegments.length ? (engine.currentIndex / engine.targetSegments.length) * 100 : 0;
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
    previous.current = { currentIndex: engine.currentIndex, errors: engine.errors, resetVersion: engine.resetVersion };
  }, [engine.currentIndex, engine.errors, engine.isComplete, engine.resetVersion, words]);

  const mascot = engine.hasCurrentError ? "🙈" : engine.isComplete ? "🏆" : streak >= 10 ? "🚀" : "🐯";

  return (
    <div className={`snp-adventure-hud ${compact ? "snp-adventure-hud-compact" : ""}`}>
      <div className="snp-coach-message" aria-live="polite"><span aria-hidden="true" className="snp-coach-mascot">{mascot}</span><p>{message}</p></div>
      <div className="snp-reward-pill"><LuFlame aria-hidden="true" className={streak ? "text-orange-500" : "text-slate-300"} fill={streak ? "currentColor" : "none"} /><span><b>{streak}</b> {words.streak}</span></div>
      <div className="snp-reward-pill" aria-label={`${earnedStars} of 3 ${words.stars}`}><LuSparkles aria-hidden="true" className="text-violet-500" /><span className="hidden sm:inline">{words.stars}</span><span className="flex gap-0.5">{[0, 1, 2].map((star) => <LuStar className={star < earnedStars ? "text-amber-500" : "text-slate-300"} fill={star < earnedStars ? "currentColor" : "none"} key={star} />)}</span></div>
    </div>
  );
}
