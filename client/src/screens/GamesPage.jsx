import { useEffect, useState } from "react";
import { Button, Tag } from "antd";
import {
  LuArrowRight,
  LuCompass,
  LuGamepad2,
  LuGhost,
  LuPickaxe,
  LuSparkles,
  LuTimer,
  LuTrophy,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import LearningCategoryCard, {
  learningCardPalette,
  learningCardPatterns,
} from "../components/LearningCategoryCard.jsx";
import { Link } from "../components/NextRouter.jsx";
import PageHero from "../components/PageHero.jsx";
import { GAME_LIST } from "../features/games/gameEngine.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

const gameIcons = {
  "minecraft-miner": LuPickaxe,
  "roblox-obby": LuCompass,
  "ghost-catcher": LuGhost,
};

const gameTags = {
  "minecraft-miner": { label: "VOXEL MINING", color: "green" },
  "roblox-obby": { label: "PLATFORM OBBY", color: "cyan" },
  "ghost-catcher": { label: "TWILIGHT MAGIC", color: "purple" },
};

export default function GamesPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listLessons({ type: "game" })
      .then(setLessons)
      .catch((value) => setError(getApiErrorMessage(value)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader message="Loading typing games…" />;
  if (error) return <PageError message={error} />;

  return (
    <div className="space-y-8 select-none">
      <PageHero
        badges={[
          { icon: LuTrophy, label: "Points, Streaks & Gems" },
          { icon: LuTimer, label: "Fun Kid-Friendly Modes" },
          { icon: LuGamepad2, label: "English & Khmer NIDA Tracks" },
        ]}
        description="Level up typing accuracy with arcade adventures! Mine Minecraft diamond ores, leap across neon Roblox platforms, and zap friendly ghosts into magic bubbles."
        eyebrow="Learn Through Play"
        icon={LuGamepad2}
        title="Kids Typing Arcade"
        tone="violet"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_LIST.map((config, index) => {
          const color = learningCardPalette[[1, 0, 2][index] ?? index];
          const GameIcon = gameIcons[config.id] || LuSparkles;
          const tagInfo = gameTags[config.id] || { label: "ARCADE", color: "blue" };

          const footer = (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                  <LuTimer size={14} />
                  <span>{config.duration}s Clock</span>
                </span>
                <span className="font-black text-rose-500">
                  {config.lives ? `${config.lives} Hearts` : "Safe Checkpoints"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  ["en", "English"],
                  ["km", "ខ្មែរ NIDA"],
                ].map(([language, label]) => {
                  const gameTrackLessons = lessons.filter(
                    (item) => item.language === language && item.type === "game"
                  );
                  const lesson =
                    lessons.find(
                      (item) =>
                        item.language === language &&
                        (item.title.toLowerCase().includes(config.lessonName.toLowerCase()) ||
                          item.slug.includes(config.id) ||
                          (config.legacyNames &&
                            config.legacyNames.some((legacy) =>
                              item.title.toLowerCase().includes(legacy.toLowerCase())
                            )))
                    ) || gameTrackLessons[index % Math.max(1, gameTrackLessons.length)];

                  return lesson ? (
                    <Link to={`/games/${config.id}/${lesson.id}`} key={language} className="block">
                      <Button
                        type="primary"
                        className="w-full flex items-center justify-center gap-1.5 font-black text-xs h-10 rounded-xl shadow-[0_3px_0_0_#15803d] active:translate-y-0.5 active:shadow-none"
                      >
                        <span>{label}</span>
                        <LuArrowRight size={13} />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled key={language} className="w-full text-xs font-bold h-10 rounded-xl">
                      {label}
                    </Button>
                  );
                })}
              </div>
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
              subtitle={`Typing Arcade · ${config.duration}s`}
              title={config.title}
              visual={<GameIcon size={28} />}
            >
              <div className="mt-2 flex items-center gap-2">
                <Tag color={tagInfo.color} className="font-black text-[10px] tracking-wider uppercase rounded-md m-0">
                  {tagInfo.label}
                </Tag>
                <span className="text-[11px] font-bold text-slate-400">Kids Study Edition</span>
              </div>
            </LearningCategoryCard>
          );
        })}
      </div>
    </div>
  );
}
