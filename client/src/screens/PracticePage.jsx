import { segmentGraphemes } from "@snp/shared";
import { useEffect, useMemo, useState } from "react";
import { LuArrowRight, LuCheck, LuKeyboard, LuLanguages, LuSparkles, LuStar, LuTarget } from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import StandaloneTypingRunner from "../features/typing/StandaloneTypingRunner.jsx";
import { buildTargetText } from "../features/typing/typingContent.js";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

const modes = [
  { key: "word", emoji: "🎈", label: { en: "Word Balloons", km: "ប៉េងប៉ោងពាក្យ" }, note: { en: "Warm up with short, friendly words.", km: "ហាត់ជាមួយពាក្យខ្លីៗ និងងាយៗ។" }, tone: "bg-sky-100 text-sky-800" },
  { key: "sentence", emoji: "🚂", label: { en: "Sentence Train", km: "រថភ្លើងប្រយោគ" }, note: { en: "Join words into smooth sentences.", km: "ភ្ជាប់ពាក្យទៅជាប្រយោគរលូន។" }, tone: "bg-amber-100 text-amber-800" },
  { key: "paragraph", emoji: "🚀", label: { en: "Story Rocket", km: "រ៉ុក្កែតអត្ថបទ" }, note: { en: "Build rhythm with a longer challenge.", km: "បង្កើនចង្វាក់ជាមួយអត្ថបទវែង។" }, tone: "bg-violet-100 text-violet-800" },
  { key: "custom", emoji: "🪄", label: { en: "Magic Text", km: "អត្ថបទវេទមន្ត" }, note: { en: "Practice text from your teacher or family.", km: "ហាត់អត្ថបទពីអ្នកគ្រូ ឬគ្រួសារ។" }, tone: "bg-rose-100 text-rose-800" },
];

const pageCopy = {
  en: { eyebrow: "Pick a typing adventure", heading: "Play, type, and earn stars!", intro: "Every correct key moves your little tiger closer to the treasure.", choose: "Choose your mission", language: "Choose a keyboard", english: "English", khmer: "Khmer", preview: "Mission preview", goal: "Accuracy goal", reward: "3 progress stars", start: "Start mission", customLabel: "Your magic text", customPlaceholder: "Type or paste practice text here…" },
  km: { eyebrow: "ជ្រើសរើសដំណើរផ្សងព្រេង", heading: "លេង វាយអក្សរ និងប្រមូលផ្កាយ!", intro: "រាល់គ្រាប់ចុចដែលត្រឹមត្រូវ នាំខ្លាតូចទៅជិតកំណប់។", choose: "ជ្រើសរើសបេសកកម្ម", language: "ជ្រើសរើសក្ដារចុច", english: "អង់គ្លេស", khmer: "ខ្មែរ", preview: "មើលបេសកកម្ម", goal: "គោលដៅភាពត្រឹមត្រូវ", reward: "ផ្កាយរង្វាន់ ៣", start: "ចាប់ផ្ដើមបេសកកម្ម", customLabel: "អត្ថបទវេទមន្តរបស់អ្នក", customPlaceholder: "សរសេរ ឬបិទភ្ជាប់អត្ថបទនៅទីនេះ…" },
};

export default function PracticePage() {
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("km");
  const [mode, setMode] = useState("word");
  const [customText, setCustomText] = useState("");
  const [session, setSession] = useState(null);

  useEffect(() => { listLessons({ category: "practice-templates" }).then(setLessons).catch((value) => setError(getApiErrorMessage(value))).finally(() => setLoading(false)); }, []);
  const template = useMemo(() => lessons.find((item) => item.language === language && item.title.toLowerCase().includes(mode === "custom" ? "custom" : mode)), [language, lessons, mode]);
  const targetText = useMemo(() => mode === "custom" ? customText.trim() : template ? buildTargetText(template) : "", [customText, mode, template]);
  const previewSegments = useMemo(() => segmentGraphemes(targetText, language === "km" ? "km" : "en"), [language, targetText]);
  const words = pageCopy[language];

  if (loading) return <PageLoader />;
  if (error) return <PageError message={error} />;
  if (session) return <StandaloneTypingRunner lesson={session.lesson} targetText={session.text} mode="practice" onExit={() => setSession(null)} />;

  function start() {
    if (!template || !targetText) return;
    setSession({ lesson: template, text: targetText });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="snp-kids-hero relative overflow-hidden rounded-xl border-2 border-slate-800 bg-gradient-to-r from-amber-300 via-orange-200 to-rose-200 p-6 shadow-[0_6px_0_0_#334155] sm:p-8">
        <span className="absolute -right-6 -top-8 rotate-12 text-8xl opacity-30" aria-hidden="true">⭐</span>
        <span className="absolute bottom-1 right-24 -rotate-6 text-6xl opacity-30" aria-hidden="true">⌨️</span>
        <div className="relative flex items-center gap-5"><span className="hidden h-24 w-24 shrink-0 place-items-center rounded-full border-2 border-slate-800 bg-white text-6xl shadow-[0_4px_0_0_#334155] sm:grid" aria-hidden="true">🐯</span><div><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-900"><LuSparkles />{words.eyebrow}</p><h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight text-slate-900 sm:text-4xl">{words.heading}</h1><p className="mt-3 max-w-2xl font-bold text-slate-700">{words.intro}</p></div></div>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-slate-800 bg-violet-200 font-black shadow-[0_2px_0_0_#334155]">{language === "km" ? "១" : "1"}</span><h2 className="text-xl font-black">{words.choose}</h2></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{modes.map((item) => {
            const selected = mode === item.key;
            return <button aria-pressed={selected} className={`group rounded-xl border-2 border-slate-800 p-4 text-left transition-all duration-100 ${selected ? `${item.tone} -translate-y-1 shadow-[0_6px_0_0_#334155]` : "bg-white shadow-[0_3px_0_0_#334155] hover:-translate-y-1 hover:shadow-[0_6px_0_0_#334155] active:translate-y-0 active:shadow-none"}`} onClick={() => setMode(item.key)} type="button" key={item.key}><div className="flex items-start gap-3"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-2 border-slate-800 bg-white text-3xl shadow-[0_2px_0_0_#334155]" aria-hidden="true">{item.emoji}</span><div><p className="flex items-center gap-2 text-lg font-black">{item.label[language]}{selected && <LuCheck className="text-emerald-700" />}</p><p className="mt-1 text-sm font-semibold leading-5 text-slate-600">{item.note[language]}</p></div></div></button>;
          })}</div>

          <div className="mt-7 flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-slate-800 bg-sky-200 font-black shadow-[0_2px_0_0_#334155]">{language === "km" ? "២" : "2"}</span><h2 className="text-xl font-black">{words.language}</h2></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{[["km", words.khmer, "ក ខ គ", LuLanguages], ["en", words.english, "A B C", LuKeyboard]].map(([value, label, sample, Icon]) => <button aria-pressed={language === value} className={`rounded-xl border-2 border-slate-800 p-4 text-left font-black transition-all duration-100 ${language === value ? "-translate-y-1 bg-emerald-100 text-emerald-800 shadow-[0_5px_0_0_#334155]" : "bg-white text-slate-700 shadow-[0_3px_0_0_#334155] hover:-translate-y-0.5 hover:shadow-[0_5px_0_0_#334155] active:translate-y-0 active:shadow-none"}`} onClick={() => setLanguage(value)} type="button" key={value}><span className="flex items-center justify-between"><span className="flex items-center gap-2"><Icon />{label}</span><span className="rounded-xl border border-slate-300 bg-white px-3 py-1 text-lg text-slate-600">{sample}</span></span></button>)}</div>

          {mode === "custom" && <div className="mt-6"><label className="snp-label font-black" htmlFor="custom-practice">{words.customLabel}</label><textarea className="snp-input min-h-40 text-lg font-bold leading-8" id="custom-practice" maxLength={2000} onChange={(event) => setCustomText(event.target.value)} placeholder={words.customPlaceholder} value={customText} /><p className="mt-2 text-right text-xs font-bold text-slate-400">{previewSegments.length} / 2,000</p></div>}
        </section>

        <aside className="lg:pt-1">
          <div className="snp-card sticky top-24 overflow-hidden p-0">
            <div className="border-b-2 border-slate-800 bg-slate-800 px-5 py-4 text-white"><p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider"><LuTarget />{words.preview}</p></div>
            <div className="p-5">
              <div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-xl border-2 border-slate-800 bg-amber-100 text-3xl shadow-[0_2px_0_0_#334155]">{modes.find((item) => item.key === mode)?.emoji}</span><div><p className="font-black">{modes.find((item) => item.key === mode)?.label[language]}</p><p className="mt-1 text-xs font-bold text-slate-500">{language === "km" ? "ក្ដារចុចខ្មែរ NIDA" : "English QWERTY"}</p></div></div>
              <div className="mt-5 min-h-28 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4"><p className="line-clamp-4 whitespace-pre-wrap break-words text-lg font-bold leading-8 text-slate-600">{previewSegments.slice(0, 70).join("") || words.customPlaceholder}</p></div>
              <div className="mt-5 space-y-3 text-sm font-black text-slate-600"><p className="flex items-center gap-2"><LuTarget className="text-emerald-600" />{words.goal}: 70%+</p><p className="flex items-center gap-2"><LuStar className="text-amber-500" fill="currentColor" />{words.reward}</p><p className="flex items-center gap-2"><LuKeyboard className="text-sky-600" />{previewSegments.length} {language === "km" ? "តួអក្សរ" : "typing units"}</p></div>
              <button className="snp-button-primary mt-6 w-full" disabled={!template || !targetText} onClick={start} type="button">{words.start}<LuArrowRight /></button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
