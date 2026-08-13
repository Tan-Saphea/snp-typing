import { useEffect, useState } from "react";
import { Link } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";
import { useAuthStore } from "../stores/authStore.js";

const games = [
  ["falling-words", "Falling Words", "⌄", "Type each word before it reaches the bottom."],
  ["balloon-typing", "Balloon Typing", "◯", "Type the word to pop each balloon."],
  ["picture-typing", "Picture Typing", "▧", "Look at a picture and type its name."],
  ["speed-challenge", "Speed Challenge", "⚡", "Type as many correct words as possible."],
];

export default function GamesPage() {
  const gamesAllowed = useAuthStore((store) => store.schoolSettings.allowTypingGames || store.user?.role !== "student");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { listLessons({ type: "game" }).then(setLessons).catch((value) => setError(getApiErrorMessage(value))).finally(() => setLoading(false)); }, []);
  if (loading) return <PageLoader />;
  if (error) return <PageError message={error} />;
  if (!gamesAllowed) return <div className="snp-card mx-auto max-w-2xl p-8 text-center"><div className="text-5xl">⌛</div><h1 className="mt-4 text-2xl font-black">Typing Games Are Paused</h1><p className="mt-2 text-slate-600">Your teacher has paused games for this class. Continue with lessons or practice.</p></div>;
  return <div><p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary-600">Learn Through Play</p><h1 className="mt-2 text-3xl font-black">Typing Games</h1><p className="mt-2 text-slate-600">Every game uses real curriculum words and saves your score.</p><div className="mt-6 grid gap-5 xl:grid-cols-2">{games.map(([key, title, icon, description], index) => <article className="snp-card p-6" key={key}><div className="grid h-14 w-14 place-items-center rounded-xl border-2 border-slate-800 bg-[#ecfdf5] text-2xl font-black text-[#047857] shadow-[0_2px_0_0_#334155]">{icon}</div><h2 className="mt-4 text-xl font-black">{title}</h2><p className="mt-2 text-slate-600">{description}</p><div className="mt-5 flex gap-3">{[["en", "English"], ["km", "ខ្មែរ"]].map(([language, label]) => { const lesson = lessons.find((item) => item.language === language && item.title.toLowerCase().includes(title.toLowerCase())); return <Link className={`rounded-xl border-2 px-4 py-2 text-sm font-black transition-all ${lesson ? "border-slate-800 bg-[#059669] text-white shadow-[0_3px_0_0_#065f46] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none" : "border-slate-300 bg-slate-100 text-slate-400 pointer-events-none"}`} to={lesson ? `/games/${key}/${lesson.id}` : "#"} key={language}>{label}</Link>; })}</div><p className="mt-4 text-xs font-bold text-slate-400">Game {index + 1} of 4</p></article>)}</div></div>;
}
