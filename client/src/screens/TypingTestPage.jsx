import { useEffect, useMemo, useState } from "react";
import { LuArrowRight, LuCheck, LuClock3, LuGauge, LuKeyboard, LuLanguages, LuShieldCheck, LuTimer } from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import PageHero from "../components/PageHero.jsx";
import StandaloneTypingRunner from "../features/typing/StandaloneTypingRunner.jsx";
import { buildTargetText } from "../features/typing/typingContent.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

const durations = [
  { value: 30, label: "30 seconds", note: "Quick warm-up" },
  { value: 60, label: "1 minute", note: "Daily check" },
  { value: 180, label: "3 minutes", note: "Focused test" },
  { value: 300, label: "5 minutes", note: "Endurance" },
];

const languages = [
  { value: "en", label: "English", local: "English QWERTY", note: "Speed measured in WPM", sample: "A B C", icon: LuKeyboard },
  { value: "km", label: "Khmer", local: "ក្ដារចុចខ្មែរ NIDA", note: "Grapheme-aware CPM", sample: "ក ខ គ", icon: LuLanguages },
];

export default function TypingTestPage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const [duration, setDuration] = useState(60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    listLessons({ type: "test" })
      .then(setLessons)
      .catch((value) => setError(getApiErrorMessage(value)))
      .finally(() => setLoading(false));
  }, []);

  const lesson = useMemo(() => lessons.find((item) => item.language === language), [language, lessons]);
  const selectedLanguage = languages.find((item) => item.value === language);
  const selectedDuration = durations.find((item) => item.value === duration);

  if (loading) return <PageLoader message="Preparing your typing tests…" />;
  if (error) return <PageError message={error} />;
  if (running && lesson) {
    const base = buildTargetText(lesson);
    return <StandaloneTypingRunner lesson={lesson} targetText={Array(30).fill(base).join(" ")} mode="test" duration={duration} onExit={() => setRunning(false)} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        badges={[
          { icon: LuGauge, label: "Live speed" },
          { icon: LuShieldCheck, label: "Results saved" },
        ]}
        description="Set a timer, stay accurate, and get a clear speed score when the round ends. The clock starts on your first key."
        eyebrow="Timed assessment"
        icon={LuTimer}
        title="Test your typing rhythm"
        tone="sky"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="space-y-7">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-slate-900 bg-sky-200 font-black shadow-[0_2px_0_0_#334155]">1</span>
              <div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Keyboard</p><h2 className="text-xl font-black">Choose a language</h2></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {languages.map((item) => {
                const Icon = item.icon;
                const selected = language === item.value;
                return (
                  <button className={`snp-choice-card ${selected ? "snp-choice-card-selected" : ""}`} aria-pressed={selected} key={item.value} onClick={() => setLanguage(item.value)} type="button">
                    <span className="flex items-start justify-between gap-3">
                      <span className={`grid h-12 w-12 place-items-center rounded-xl border-2 border-slate-900 ${selected ? "bg-white text-emerald-800" : "bg-slate-100 text-slate-700"}`}><Icon size={22} /></span>
                      <span className={`grid h-7 w-7 place-items-center rounded-full border-2 ${selected ? "border-emerald-700 bg-emerald-600 text-white" : "border-slate-300 text-transparent"}`}><LuCheck size={15} /></span>
                    </span>
                    <span className="mt-4 block text-lg font-black">{item.label}</span>
                    <span className="mt-1 block text-xs font-bold text-slate-500">{item.local}</span>
                    <span className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs font-bold text-slate-500"><span>{item.note}</span><b className="text-base text-slate-700">{item.sample}</b></span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-slate-900 bg-amber-200 font-black shadow-[0_2px_0_0_#334155]">2</span>
              <div><p className="text-xs font-black uppercase tracking-wider text-slate-400">Timer</p><h2 className="text-xl font-black">Choose a duration</h2></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {durations.map((item) => {
                const selected = duration === item.value;
                return (
                  <button className={`snp-choice-card p-4 text-center ${selected ? "snp-choice-card-selected" : ""}`} aria-pressed={selected} key={item.value} onClick={() => setDuration(item.value)} type="button">
                    <LuClock3 className={`mx-auto ${selected ? "text-emerald-700" : "text-slate-400"}`} size={23} />
                    <span className="mt-2 block font-black">{item.label}</span>
                    <span className="mt-1 block text-[11px] font-bold text-slate-500">{item.note}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside>
          <div className="snp-card sticky top-24 overflow-hidden">
            <div className="border-b-2 border-slate-900 bg-slate-900 px-5 py-4 text-white"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em]"><LuGauge />Your test setup</p></div>
            <div className="p-5">
              <div className="grid place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 py-7 text-center">
                <LuTimer className="text-primary-600" size={38} />
                <p className="mt-3 text-3xl font-black tracking-tight">{selectedDuration?.label}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{selectedDuration?.note}</p>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4"><dt className="font-bold text-slate-500">Language</dt><dd className="font-black">{selectedLanguage?.label}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="font-bold text-slate-500">Primary score</dt><dd className="font-black">{language === "km" ? "CPM" : "WPM"}</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="font-bold text-slate-500">Timing starts</dt><dd className="font-black">First key</dd></div>
                <div className="flex items-center justify-between gap-4"><dt className="font-bold text-slate-500">Saved to progress</dt><dd className="font-black text-emerald-700">Yes</dd></div>
              </dl>
              <button className="snp-button-primary mt-6 w-full" disabled={!lesson} onClick={() => setRunning(true)} type="button">Start typing test<LuArrowRight /></button>
              <p className="mt-3 text-center text-xs font-semibold text-slate-400">Focus on accuracy first—speed follows rhythm.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
