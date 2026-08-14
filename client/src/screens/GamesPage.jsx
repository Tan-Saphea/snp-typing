import { useEffect, useState } from "react";
import { LuArrowRight, LuGamepad2, LuSparkles, LuTimer, LuTrophy } from "react-icons/lu";
import { Link } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import LearningCategoryCard, { learningCardPalette, learningCardPatterns } from "../components/LearningCategoryCard.jsx";
import { GAME_LIST } from "../features/games/gameEngine.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

export default function GamesPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { listLessons({ type: "game" }).then(setLessons).catch((value) => setError(getApiErrorMessage(value))).finally(() => setLoading(false)); }, []);
  if (loading) return <PageLoader />;
  if (error) return <PageError message={error} />;
  return (
    <div className="space-y-7">
      <section className="snp-game-library-hero relative overflow-hidden p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 text-[12rem] opacity-10"><LuGamepad2 /></div>
        <div className="relative max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300"><LuSparkles />Learn through play</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Typing Arcade</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Choose a challenge, select English or Khmer, and turn accurate typing into points, streaks, and stars.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold"><span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2"><LuTrophy className="text-amber-300" />Scores saved</span><span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2"><LuTimer className="text-sky-300" />Quick rounds</span><span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2">ក · A Grapheme-aware</span></div>
        </div>
      </section>

      <div className="snp-learning-grid">
        {GAME_LIST.map((config, index) => {
          const color = learningCardPalette[[1, 2, 0, 6][index] ?? index];
          const footer = (
            <div className="snp-learning-card-actions">
              {[["en", "English"], ["km", "ខ្មែរ"]].map(([language, label]) => {
                const lesson = lessons.find((item) => item.language === language && item.title.toLowerCase().includes(config.lessonName.toLowerCase()));
                return lesson ? <Link className="snp-learning-card-action" to={`/games/${config.id}/${lesson.id}`} key={language}>{label}<LuArrowRight /></Link> : <span className="snp-learning-card-action pointer-events-none opacity-40" key={language}>{label}</span>;
              })}
            </div>
          );
          return (
            <LearningCategoryCard
              accent={color.accent}
              badge={`0${index + 1}`}
              deep={color.deep}
              description={config.description}
              footer={footer}
              key={config.id}
              pattern={learningCardPatterns[index % learningCardPatterns.length]}
              subtitle={`Typing game · ${config.duration} seconds`}
              title={config.title}
              visual={<span>{config.icon}</span>}
            >
              <div className="snp-learning-card-meta"><span><LuTimer />{config.duration}s</span><span>{config.lives ? `${config.lives} hearts` : "Unlimited tries"}</span></div>
            </LearningCategoryCard>
          );
        })}
      </div>
    </div>
  );
}
