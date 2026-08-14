import { normalizeForComparison, segmentGraphemes } from "@snp/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { LuAlignCenter, LuArrowLeft, LuBold, LuCaseUpper, LuCheck, LuClipboardPaste, LuCopy, LuFileText, LuHighlighter, LuImage, LuItalic, LuList, LuListOrdered, LuPalette, LuRedo2, LuScissors, LuShapes, LuSparkles, LuTextCursorInput, LuTrophy, LuUnderline, LuUndo2 } from "react-icons/lu";
import { Link, useParams } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { buildTargetText } from "../features/typing/typingContent.js";
import { getApiErrorMessage } from "../services/api.js";
import { getLesson } from "../services/lessonService.js";
import { saveLessonResult } from "../services/resultService.js";

const tools = [
  ["Copy", LuCopy], ["Paste", LuClipboardPaste], ["Cut", LuScissors],
  ["Undo", LuUndo2], ["Redo", LuRedo2], ["Font", LuCaseUpper],
  ["Font Size", LuTextCursorInput], ["Bold", LuBold], ["Italic", LuItalic],
  ["Underline", LuUnderline], ["Font Color", LuPalette], ["Highlight", LuHighlighter],
  ["Alignment", LuAlignCenter], ["Bullets", LuList], ["Numbering", LuListOrdered],
  ["Pictures", LuImage], ["Shapes", LuShapes],
];

export default function ComputerSkillWorkspacePage() {
  const { lessonId } = useParams();
  const [state, setState] = useState({ loading: true, lesson: null, error: "" });
  const [text, setText] = useState("");
  const [clipboard, setClipboard] = useState("");
  const [history, setHistory] = useState([]);
  const [redo, setRedo] = useState([]);
  const [applied, setApplied] = useState([]);
  const [format, setFormat] = useState({ bold: false, italic: false, underline: false, size: 16, color: "#172033", highlight: "transparent", align: "left", font: "sans-serif" });
  const [result, setResult] = useState(null);
  const startedAt = useRef(null);
  useEffect(() => { getLesson(lessonId).then(({ lesson }) => { setState({ loading: false, lesson, error: "" }); setText(""); }).catch((error) => setState({ loading: false, lesson: null, error: getApiErrorMessage(error) })); }, [lessonId]);
  const requirements = useMemo(() => state.lesson?.content.blocks.flatMap((block) => block.items ?? []) ?? [], [state.lesson]);
  if (state.loading) return <PageLoader />;
  if (state.error) return <PageError message={state.error} />;

  function remember() { setHistory((value) => [...value.slice(-19), { text, format }]); setRedo([]); }
  function apply(tool) {
    startedAt.current ??= Date.now();
    if (tool === "Undo") { const previous = history.at(-1); if (previous) { setRedo((value) => [...value, { text, format }]); setText(previous.text); setFormat(previous.format); setHistory((value) => value.slice(0, -1)); } }
    else if (tool === "Redo") { const next = redo.at(-1); if (next) { setHistory((value) => [...value, { text, format }]); setText(next.text); setFormat(next.format); setRedo((value) => value.slice(0, -1)); } }
    else { remember(); if (tool === "Copy") setClipboard(text); if (tool === "Paste") setText((value) => `${value}${clipboard}`); if (tool === "Cut") { setClipboard(text); setText(""); } if (tool === "Font") setFormat((value) => ({ ...value, font: value.font === "serif" ? "sans-serif" : "serif" })); if (tool === "Font Size") setFormat((value) => ({ ...value, size: value.size === 24 ? 16 : 24 })); if (tool === "Bold") setFormat((value) => ({ ...value, bold: !value.bold })); if (tool === "Italic") setFormat((value) => ({ ...value, italic: !value.italic })); if (tool === "Underline") setFormat((value) => ({ ...value, underline: !value.underline })); if (tool === "Font Color") setFormat((value) => ({ ...value, color: value.color === "#087ac2" ? "#172033" : "#087ac2" })); if (tool === "Highlight") setFormat((value) => ({ ...value, highlight: value.highlight === "#fde68a" ? "transparent" : "#fde68a" })); if (tool === "Alignment") setFormat((value) => ({ ...value, align: value.align === "left" ? "center" : value.align === "center" ? "right" : "left" })); if (tool === "Bullets") setText((value) => value.split("\n").map((line) => `• ${line}`).join("\n")); if (tool === "Numbering") setText((value) => value.split("\n").map((line, index) => `${index + 1}. ${line}`).join("\n")); if (tool === "Pictures") setText((value) => `${value}\n🖼️`); if (tool === "Shapes") setText((value) => `${value}\n◆`); }
    setApplied((value) => value.includes(tool) ? value : [...value, tool]);
  }

  async function complete() {
    const target = buildTargetText(state.lesson);
    const comparableText = text.replace(/^(?:• |\d+\. )/gmu, "").replace(/\n[🖼️◆]/gu, "").trim();
    const targetUnits = segmentGraphemes(normalizeForComparison(target));
    const typedUnits = segmentGraphemes(normalizeForComparison(comparableText));
    const comparedLength = Math.max(targetUnits.length, typedUnits.length);
    let correct = 0;
    for (let index = 0; index < comparedLength; index += 1) if (targetUnits[index] === typedUnits[index]) correct += 1;
    const errors = comparedLength - correct;
    const start = startedAt.current ?? Date.now();
    const duration = Math.max((Date.now() - start) / 1000, 0.1);
    try {
      const saved = await saveLessonResult({ lessonId: state.lesson.id, startedAt: new Date(start).toISOString(), duration, totalTyped: Math.max(typedUnits.length, 1), totalCharacters: targetUnits.length, correctCharacters: correct, incorrectCharacters: errors, totalGraphemes: targetUnits.length, correctGraphemes: correct, incorrectGraphemes: errors, errors, mode: "lesson" });
      setResult({ ...saved.result, duration, formatting: requirements.length ? Math.round((requirements.filter((item) => applied.includes(item)).length / requirements.length) * 30) : 30 });
    } catch (error) { setState((current) => ({ ...current, error: getApiErrorMessage(error) })); }
  }

  if (result) {
    return (
      <div className="snp-result-dialog mx-auto max-w-2xl overflow-hidden p-6 text-center sm:p-8">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border-2 border-slate-900 bg-emerald-300 text-4xl text-emerald-950 shadow-[0_5px_0_0_#059669]"><LuTrophy /></span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Task complete</p>
        <h1 className="mt-2 text-3xl font-black">Computer Skill Complete</h1>
        <p className="mt-2 text-slate-600">
          Typing and formatting results were saved.
        </p>
        
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ["Typing", Math.min(40, Math.round(result.accuracy * 0.4))],
            ["Accuracy", Math.min(20, Math.round(result.accuracy * 0.2))],
            ["Formatting", result.formatting],
            ["Time", 10]
          ].map(([label, value]) => (
            <div
              className="rounded-xl border-2 border-slate-900 bg-white p-4 shadow-[0_3px_0_0_#10b981]"
              key={label}
            >
              <p className="text-xs font-black text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-black text-[#047857]">{value}</p>
            </div>
          ))}
        </div>
        
        <p className="mt-6 text-3xl font-black text-[#047857]">
          Total: {Math.min(
            100,
            Math.min(40, Math.round(result.accuracy * 0.4)) +
              Math.min(20, Math.round(result.accuracy * 0.2)) +
              result.formatting +
              10
          )}/100
        </p>
        
        <Link className="snp-brutal-button mt-6 px-6" to="/computer-skills">
          Back to Skills
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Link className="inline-flex items-center gap-2 text-sm font-black text-primary-700 hover:underline" to="/computer-skills">
        <LuArrowLeft />Computer Skills
      </Link>
      
      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700"><LuSparkles />Skill lesson · Level {state.lesson.level}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{state.lesson.title}</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{state.lesson.instructions}</p></div><span className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-[0_3px_0_0_#cbd5e1]"><LuFileText />Practice document</span></header>
      
      {state.error && (
        <p className="mt-4 rounded-xl border-2 border-red-500 bg-red-50 p-4 font-bold text-red-700 shadow-[0_3px_0_0_#ef4444]">
          {state.error}
        </p>
      )}
      
      {/* Target Text Card */}
      <section className="snp-brutal-card mt-6 p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider opacity-90"><LuFileText />
          Type this text first
        </p>
        <p className="mt-3 whitespace-pre-wrap text-lg font-bold leading-8">
          {buildTargetText(state.lesson)}
        </p>
      </section>
      
      {/* Toolbar Container */}
      <div className="snp-scrollbar mt-5 flex gap-2 overflow-x-auto rounded-xl border-2 border-slate-800 bg-white p-3 shadow-[0_4px_0_0_#334155]">
        {tools.map(([tool, Icon]) => (
          <button
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black border-2 border-slate-800 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer ${
              applied.includes(tool)
                ? "bg-emerald-100 text-emerald-800 shadow-[0_2px_0_0_#059669]"
                : "bg-slate-100 text-slate-700 shadow-[0_2px_0_0_#334155]"
            }`}
            onClick={() => apply(tool)}
            type="button"
            key={tool}
          >
            <Icon size={16} />{tool}
          </button>
        ))}
      </div>
      
      {/* Editor & Requirements Container */}
      <section className="snp-brutal-card-slate mt-5 p-4 sm:p-6">
        <textarea
          className="min-h-[330px] w-full resize-none rounded-xl border-2 border-slate-800 p-5 focus:outline-none focus:ring-4 focus:ring-emerald-100 transition-colors shadow-[0_2px_0_0_#334155]"
          onChange={(event) => {
            startedAt.current ??= Date.now();
            remember();
            setText(event.target.value);
          }}
          style={{
            fontFamily: format.font,
            fontSize: format.size,
            fontWeight: format.bold ? 800 : 400,
            fontStyle: format.italic ? "italic" : "normal",
            textDecoration: format.underline ? "underline" : "none",
            color: format.color,
            backgroundColor: format.highlight,
            textAlign: format.align,
          }}
          value={text}
        />
        
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="flex items-center gap-2 text-sm font-black text-slate-800"><LuCheck className="text-emerald-600" />Requirements</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {requirements.map((item) => (
              <span
                className={`rounded-xl px-3 py-1 text-xs font-black border-2 border-slate-800 ${
                  applied.includes(item)
                    ? "bg-emerald-100 text-emerald-800 shadow-[0_2px_0_0_#059669]"
                    : "bg-amber-100 text-amber-900 shadow-[0_2px_0_0_#f59e0b]"
                }`}
                key={item}
              >
                {applied.includes(item) ? "✓ " : ""}
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
      
      <button
        className="snp-brutal-button mt-6 w-full px-7 sm:w-auto"
        disabled={!text.trim()}
        onClick={complete}
        type="button"
      >
        Complete Task
      </button>
    </div>
  );
}
