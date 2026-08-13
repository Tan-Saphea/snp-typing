import { normalizeForComparison, segmentGraphemes } from "@snp/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { getLesson } from "../services/lessonService.js";
import { saveLessonResult } from "../services/resultService.js";

const pictures = { en: [["✏️", "pencil"], ["📘", "book"], ["🎒", "school bag"], ["🔴", "red"], ["⭐", "star"]], km: [["📘", "សៀវភៅ"], ["🏫", "សាលា"], ["💧", "ទឹក"], ["🌳", "ដើមឈើ"], ["👩‍🏫", "គ្រូ"]] };
const gameTitles = { "falling-words": "Falling Words", "balloon-typing": "Balloon Typing", "picture-typing": "Picture Typing", "speed-challenge": "Speed Challenge" };

export default function WordGamePage() {
  const { game, lessonId } = useParams();
  const [state, setState] = useState({ loading: true, lesson: null, error: "" });
  const [round, setRound] = useState({ index: 0, correct: 0, incorrect: 0, errors: 0, typedUnits: 0, finished: false, result: null });
  const [input, setInput] = useState("");
  const [remaining, setRemaining] = useState(45);
  const [fall, setFall] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const composing = useRef(false);
  const startedAt = useRef(null);
  useEffect(() => { getLesson(lessonId).then((value) => setState({ loading: false, lesson: value.lesson, error: "" })).catch((error) => setState({ loading: false, lesson: null, error: getApiErrorMessage(error) })); }, [lessonId]);
  const sourceWords = useMemo(() => state.lesson?.contentItems?.filter(Boolean) ?? [], [state.lesson]);
  const gameItems = game === "picture-typing" && state.lesson ? pictures[state.lesson.language] : sourceWords.map((word) => ["", word]);
  const current = gameItems[round.index % Math.max(gameItems.length, 1)] ?? ["", ""];

  const finish = useCallback(async (snapshot = round) => {
    if (!state.lesson || snapshot.finished || saving) return;
    setSaving(true); setSaveError("");
    const duration = Math.max(45 - remaining, 1);
    const total = snapshot.correct + snapshot.incorrect;
    try {
      const result = await saveLessonResult({ lessonId: state.lesson.id, startedAt: new Date(Date.now() - duration * 1000).toISOString(), duration, totalTyped: snapshot.typedUnits, totalCharacters: total, correctCharacters: state.lesson.language === "en" ? snapshot.correct : 0, incorrectCharacters: state.lesson.language === "en" ? snapshot.incorrect : 0, totalGraphemes: total, correctGraphemes: snapshot.correct, incorrectGraphemes: snapshot.incorrect, errors: snapshot.errors, mode: "game" });
      setRound((value) => ({ ...value, finished: true, result: result.result }));
    } catch (error) { setSaveError(getApiErrorMessage(error)); }
    finally { setSaving(false); }
  }, [remaining, round, saving, state.lesson]);

  useEffect(() => {
    if (!startedAt.current || round.finished) return undefined;
    const timer = window.setInterval(() => {
      const left = Math.max(0, 45 - (Date.now() - startedAt.current) / 1000);
      setRemaining(left);
      if (game === "falling-words") setFall((value) => Math.min(100, value + 2));
    }, 250);
    return () => window.clearInterval(timer);
  }, [game, round.finished]);
  useEffect(() => { if (remaining <= 0 && !round.finished && startedAt.current && !saveError) void finish(); }, [finish, remaining, round.finished, saveError]);
  useEffect(() => { if (fall >= 100 && game === "falling-words" && !round.finished) { const missedUnits = segmentGraphemes(current[1], state.lesson.language).length; const next = { ...round, index: round.index + 1, incorrect: round.incorrect + missedUnits, errors: round.errors + 1, typedUnits: round.typedUnits + missedUnits }; setRound(next); setFall(0); } }, [current, fall, game, round, state.lesson]);

  function submit(value = input) {
    if (!state.lesson || round.finished || !value.trim()) return;
    if (!startedAt.current) startedAt.current = Date.now();
    const expected = normalizeForComparison(current[1]).toLocaleLowerCase();
    const received = normalizeForComparison(value.trim()).toLocaleLowerCase();
    const correctUnits = segmentGraphemes(current[1], state.lesson.language === "km" ? "km" : "en").length;
    const isCorrect = expected === received;
    const receivedUnits = segmentGraphemes(value.trim(), state.lesson.language).length;
    const next = { ...round, index: round.index + (isCorrect ? 1 : 0), correct: round.correct + (isCorrect ? correctUnits : 0), incorrect: round.incorrect + (isCorrect ? 0 : receivedUnits), errors: round.errors + (isCorrect ? 0 : 1), typedUnits: round.typedUnits + receivedUnits };
    if (isCorrect) setFall(0);
    setRound(next);
    setInput("");
    if (game === "picture-typing" && isCorrect && next.index >= gameItems.length) void finish(next);
  }

  if (state.loading) return <PageLoader />;
  if (state.error) return <PageError message={state.error} />;
  if (round.finished) return <div className="snp-card mx-auto max-w-2xl p-8 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-xl border-2 border-slate-800 bg-emerald-100 text-3xl text-emerald-700 shadow-[0_2px_0_0_#334155]">✓</div><h1 className="mt-4 text-3xl font-black">Game Complete</h1><div className="mt-6 grid grid-cols-3 gap-3">{[["Score", round.result?.score], ["Accuracy", `${Math.round(round.result?.accuracy ?? 0)}%`], ["Stars", `★ ${round.result?.stars ?? 0}`]].map(([label, value]) => <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={label}><p className="text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>)}</div><div className="mt-6 flex justify-center gap-3"><button className="snp-button-secondary" onClick={() => { setRound({ index: 0, correct: 0, incorrect: 0, errors: 0, typedUnits: 0, finished: false, result: null }); setRemaining(45); setSaveError(""); startedAt.current = null; }} type="button">Play Again</button><Link className="snp-button-primary" to="/games">Games</Link></div></div>;
 
  return <div><Link className="font-black text-primary-700" to="/games">← Back to Games</Link><div className="mt-4 flex items-end justify-between"><div><p className="text-sm font-extrabold uppercase tracking-wider text-primary-600">{state.lesson.language === "km" ? "Khmer Game" : "English Game"}</p><h1 className="mt-1 text-3xl font-black">{gameTitles[game]}</h1></div><p className="text-2xl font-black text-slate-700">{Math.ceil(remaining)}s</p></div>{saveError && <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-700"><span>{saveError}</span><button className="rounded-xl border-2 border-slate-800 bg-white px-4 py-2 hover:bg-slate-50 active:translate-y-[2px] transition" disabled={saving} onClick={() => { setSaveError(""); void finish(); }} type="button">Retry Save</button></div>}<section className="snp-card relative mt-5 min-h-[370px] overflow-hidden p-8 text-center">{game === "falling-words" && <div className="absolute left-1/2 -translate-x-1/2 rounded-xl border-2 border-slate-800 bg-[#059669] px-6 py-3 text-2xl font-black text-white shadow-[0_3px_0_0_#065f46]" style={{ top: `${Math.min(82, fall)}%` }}>{current[1]}</div>}{game === "balloon-typing" && <div className="mx-auto grid h-56 w-48 place-items-center rounded-[50%] bg-gradient-to-b from-pink-300 to-pink-500 text-2xl font-black text-white shadow-xl">{current[1]}</div>}{game === "picture-typing" && <div className="mt-10 text-8xl">{current[0]}</div>}{game === "speed-challenge" && <div className="mt-20 text-5xl font-black text-primary-700">{current[1]}</div>}<div className="absolute inset-x-8 bottom-8"><input autoFocus className="snp-input text-center text-xl font-black" onChange={(event) => { setInput(event.target.value); if (!startedAt.current && event.target.value) startedAt.current = Date.now(); }} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={(event) => { composing.current = false; if (game !== "picture-typing" && event.currentTarget.value.endsWith(" ")) submit(event.currentTarget.value); }} onKeyDown={(event) => { if (event.key === "Enter" && !composing.current) submit(); }} placeholder="Type the word and press Enter" value={input} /><div className="mt-3 flex justify-center gap-5 text-sm font-bold text-slate-500"><span>Correct units: {round.correct}</span><span>Errors: {round.errors}</span></div></div></section></div>;
}
