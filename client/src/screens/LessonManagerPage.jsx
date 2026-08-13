import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildLessonTargetText,
  countLessonTargetGraphemes,
  LESSON_TARGET_MAX_GRAPHEMES,
  LESSON_TARGET_MIN_GRAPHEMES,
} from "@snp/shared";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { getApiErrorMessage } from "../services/api.js";
import {
  archiveManagedLesson,
  createManagedLesson,
  duplicateManagedLesson,
  listManagedLessons,
  reorderManagedLessons,
  updateManagedLesson,
} from "../services/managementService.js";

const emptyFilters = { language: "", level: "", type: "", difficulty: "", published: "", contentStatus: "" };
const emptyForm = {
  id: "", title: "", titleKhmer: "", description: "", slug: "", language: "en", category: "custom-lessons",
  level: 1, order: 1, difficulty: "easy", type: "word", instructions: "Type the content carefully.", contentText: "",
  minimumAccuracy: 70, minimumSpeed: 0, timeLimit: 0, starsEnabled: true, allowBackspace: true, isLocked: false,
  isPublished: false, sourceBook: "", sourcePage: "", sourceExercise: "", contentStatus: "custom", reviewNotes: "",
};

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function lessonContent(lesson) {
  return buildLessonTargetText(lesson) || lesson.contentItems?.join("\n") || "";
}

function blockFromForm(form) {
  const lines = form.contentText.split("\n").map((item) => item.trim()).filter(Boolean);
  if (["paragraph", "story", "test"].includes(form.type)) return [{ kind: form.type === "story" ? "story" : "paragraph", text: form.contentText.trim() }];
  if (form.type === "computer-skill") return [{ kind: "formatting", text: form.contentText.trim(), items: [] }];
  return [{ kind: form.type === "sentence" ? "sentences" : "items", items: lines }];
}

function toForm(lesson) {
  return {
    ...emptyForm,
    ...lesson,
    id: lesson.id,
    sourcePage: lesson.sourcePage || "",
    reviewNotes: lesson.source?.reviewNotes || "",
    contentText: lessonContent(lesson),
  };
}

function LessonForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(initial);
  const [state, setState] = useState({ saving: false, error: "" });
  const contentBlocks = useMemo(() => blockFromForm(form), [form]);
  const targetCount = useMemo(() => countLessonTargetGraphemes({ language: form.language, contentBlocks }), [contentBlocks, form.language]);
  const requiresLengthCheck = form.type !== "game" && form.contentStatus !== "needs_review";
  const targetLengthValid = !requiresLengthCheck || (targetCount >= LESSON_TARGET_MIN_GRAPHEMES && targetCount <= LESSON_TARGET_MAX_GRAPHEMES);
  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value, ...(name === "title" && !current.id && !current.slug ? { slug: slugify(value) } : {}) }));
  }
  async function submit(event) {
    event.preventDefault();
    setState({ saving: true, error: "" });
    const blocks = contentBlocks;
    if (!blocks[0].text && !blocks[0].items?.length) {
      setState({ saving: false, error: "Enter lesson content before saving." });
      return;
    }
    if (form.isPublished && !targetLengthValid) {
      setState({ saving: false, error: `Published lesson content must contain ${LESSON_TARGET_MIN_GRAPHEMES}-${LESSON_TARGET_MAX_GRAPHEMES} grapheme characters. Current count: ${targetCount}.` });
      return;
    }
    const payload = {
      title: form.title, titleKhmer: form.titleKhmer, description: form.description, slug: form.slug, language: form.language,
      category: form.category, level: Number(form.level), order: Number(form.order), difficulty: form.difficulty, type: form.type,
      instructions: form.instructions, contentItems: form.contentText.split("\n").map((item) => item.trim()).filter(Boolean), contentBlocks: blocks,
      minimumAccuracy: Number(form.minimumAccuracy), minimumSpeed: Number(form.minimumSpeed), timeLimit: Number(form.timeLimit),
      starsEnabled: form.starsEnabled, allowBackspace: form.allowBackspace, isLocked: form.isLocked,
      isPublished: form.contentStatus === "needs_review" ? false : form.isPublished, isActive: true,
      sourceBook: form.sourceBook, sourcePage: form.sourcePage ? Number(form.sourcePage) : undefined,
      sourceExercise: form.sourceExercise, contentStatus: form.contentStatus, reviewNotes: form.reviewNotes,
    };
    try {
      if (form.id) await updateManagedLesson(form.id, payload);
      else await createManagedLesson(payload);
      await onSaved();
    } catch (error) {
      setState({ saving: false, error: getApiErrorMessage(error) });
    }
  }
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-5 backdrop-blur-sm"><form className="mx-auto max-w-5xl rounded-xl border-2 border-slate-800 bg-white p-7 shadow-[0_4px_0_0_#334155]" onSubmit={submit}><div className="flex items-start justify-between"><div><p className="text-xs font-extrabold uppercase tracking-wider text-primary-600">Lesson Editor</p><h2 className="mt-1 text-2xl font-black">{form.id ? "Edit Lesson" : "Add Lesson"}</h2></div><button className="grid h-10 w-10 place-items-center rounded-xl border-2 border-slate-800 bg-slate-100 font-black hover:bg-slate-200 transition" onClick={onCancel} type="button">×</button></div>{state.error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-700" role="alert">{state.error}</p>}<div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <label className="snp-label md:col-span-2">Title<input className="snp-input mt-2" onChange={(event) => change("title", event.target.value)} required value={form.title} /></label>
    <label className="snp-label md:col-span-2">Khmer Title<input className="snp-input mt-2" onChange={(event) => change("titleKhmer", event.target.value)} value={form.titleKhmer} /></label>
    <label className="snp-label md:col-span-2">Slug<input className="snp-input mt-2" onChange={(event) => change("slug", slugify(event.target.value))} required value={form.slug} /></label>
    <label className="snp-label md:col-span-2">Category<input className="snp-input mt-2" onChange={(event) => change("category", event.target.value)} required value={form.category} /></label>
    <label className="snp-label">Language<select className="snp-input mt-2" onChange={(event) => change("language", event.target.value)} value={form.language}><option value="en">English</option><option value="km">Khmer</option></select></label>
    <label className="snp-label">Level<input className="snp-input mt-2" min="1" max="20" onChange={(event) => change("level", event.target.value)} required type="number" value={form.level} /></label>
    <label className="snp-label">Order<input className="snp-input mt-2" min="1" onChange={(event) => change("order", event.target.value)} required type="number" value={form.order} /></label>
    <label className="snp-label">Type<select className="snp-input mt-2" onChange={(event) => change("type", event.target.value)} value={form.type}>{["letter", "word", "sentence", "paragraph", "story", "test", "game", "computer-skill"].map((value) => <option key={value}>{value}</option>)}</select></label>
    <label className="snp-label">Difficulty<select className="snp-input mt-2" onChange={(event) => change("difficulty", event.target.value)} value={form.difficulty}>{["beginner", "easy", "medium", "challenge", "advanced"].map((value) => <option key={value}>{value}</option>)}</select></label>
    <label className="snp-label">Minimum Accuracy<input className="snp-input mt-2" min="0" max="100" onChange={(event) => change("minimumAccuracy", event.target.value)} type="number" value={form.minimumAccuracy} /></label>
    <label className="snp-label">Minimum Speed<input className="snp-input mt-2" min="0" onChange={(event) => change("minimumSpeed", event.target.value)} type="number" value={form.minimumSpeed} /></label>
    <label className="snp-label">Time Limit (seconds)<input className="snp-input mt-2" min="0" onChange={(event) => change("timeLimit", event.target.value)} type="number" value={form.timeLimit} /></label>
    <label className="snp-label md:col-span-2 xl:col-span-4">Instructions<textarea className="snp-input mt-2 min-h-20" onChange={(event) => change("instructions", event.target.value)} value={form.instructions} /></label>
    <label className="snp-label md:col-span-2 xl:col-span-4">Content <span className="font-normal text-slate-400">(one item or sentence per line)</span><textarea className="snp-input mt-2 min-h-44 font-medium" dir={form.language === "km" ? "ltr" : undefined} onChange={(event) => change("contentText", event.target.value)} required value={form.contentText} /><span className={`mt-2 block text-sm font-bold ${targetLengthValid ? "text-emerald-700" : "text-amber-700"}`}>{targetCount} grapheme characters · required range {LESSON_TARGET_MIN_GRAPHEMES}–{LESSON_TARGET_MAX_GRAPHEMES}{form.type === "game" ? " (game word banks are dynamic)" : ""}</span></label>
    <label className="snp-label">Content Status<select className="snp-input mt-2" onChange={(event) => change("contentStatus", event.target.value)} value={form.contentStatus}><option value="verified">Verified</option><option value="custom">Custom</option><option value="needs_review">Needs Review</option></select></label>
    <label className="snp-label">Source Page<input className="snp-input mt-2" min="1" onChange={(event) => change("sourcePage", event.target.value)} type="number" value={form.sourcePage} /></label>
    <label className="snp-label md:col-span-2">Source Book<input className="snp-input mt-2" onChange={(event) => change("sourceBook", event.target.value)} value={form.sourceBook} /></label>
    <label className="snp-label md:col-span-2">Source Exercise<input className="snp-input mt-2" onChange={(event) => change("sourceExercise", event.target.value)} value={form.sourceExercise} /></label>
    <label className="snp-label md:col-span-2">Review Notes<textarea className="snp-input mt-2 min-h-20" onChange={(event) => change("reviewNotes", event.target.value)} value={form.reviewNotes} /></label>
  </div><div className="mt-5 flex flex-wrap gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4">{[["starsEnabled", "Stars enabled"], ["allowBackspace", "Allow backspace"], ["isLocked", "Manually locked"], ["isPublished", "Published"]].map(([name, label]) => <label className="flex items-center gap-2 font-bold" key={name}><input checked={form[name]} disabled={name === "isPublished" && form.contentStatus === "needs_review"} onChange={(event) => change(name, event.target.checked)} type="checkbox" />{label}</label>)}</div><div className="mt-6 flex justify-end gap-3"><button className="snp-button-secondary" onClick={onCancel} type="button">Cancel</button><button className="snp-button-primary" disabled={state.saving} type="submit">{state.saving ? "Saving…" : "Save Lesson"}</button></div></form></div>;
}

export default function LessonManagerPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [state, setState] = useState({ loading: true, lessons: [], stats: null, error: "" });
  const [editor, setEditor] = useState(null);
  const [preview, setPreview] = useState(null);
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
      const data = await listManagedLessons(query);
      setState({ loading: false, lessons: data.lessons, stats: data.stats, error: "" });
    } catch (error) { setState((current) => ({ ...current, loading: false, error: getApiErrorMessage(error) })); }
  }, [filters]);
  useEffect(() => { void load(); }, [load]);
  const adjacent = useMemo(() => new Map(state.lessons.map((lesson, index) => [lesson.id, { previous: state.lessons[index - 1], next: state.lessons[index + 1] }])), [state.lessons]);
  async function move(lesson, direction) {
    const neighbor = direction === "up" ? adjacent.get(lesson.id)?.previous : adjacent.get(lesson.id)?.next;
    if (!neighbor || neighbor.language !== lesson.language || neighbor.level !== lesson.level || neighbor.category !== lesson.category) return;
    await reorderManagedLessons([{ id: lesson.id, order: neighbor.order }, { id: neighbor.id, order: lesson.order }]);
    await load();
  }
  if (state.loading && !state.stats) return <PageLoader message="Loading curriculum manager…" />;
  if (state.error && !state.stats) return <PageError message={state.error} onRetry={load} />;
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-extrabold uppercase tracking-wider text-primary-600">Curriculum Management</p><h1 className="mt-2 text-3xl font-black">Lesson Manager</h1><p className="mt-2 text-slate-600">Create, review, order, and publish database lessons.</p></div><button className="snp-button-primary" onClick={() => setEditor({ ...emptyForm, order: Math.max(0, ...state.lessons.map((item) => item.order)) + 1 })} type="button">+ Add Lesson</button></div>
    <section className="mt-6 grid gap-4 md:grid-cols-4">{[["Total Lessons", state.stats.total], ["English", state.stats.english], ["Khmer", state.stats.khmer], ["Needs Review", state.stats.needsReview]].map(([label, value], index) => <article className="snp-card p-5" key={label}><p className={`text-sm font-bold ${index === 3 ? "text-amber-700" : "text-slate-500"}`}>{label}</p><p className="mt-2 text-3xl font-black">{value}</p></article>)}</section>
    <section className="snp-card mt-5 grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">{[["language", "All languages", ["en", "km"]], ["level", "All levels", [1,2,3,4,5,6,7]], ["type", "All types", ["letter","word","sentence","paragraph","story","test","game","computer-skill"]], ["difficulty", "All difficulties", ["beginner","easy","medium","challenge","advanced"]], ["published", "All publishing", ["true","false"]], ["contentStatus", "All statuses", ["verified","custom","needs_review"]]].map(([name, label, values]) => <select className="snp-input" key={name} onChange={(event) => setFilters((current) => ({ ...current, [name]: event.target.value }))} value={filters[name]}><option value="">{label}</option>{values.map((value) => <option value={value} key={value}>{String(value).replaceAll("_", " ")}</option>)}</select>)}</section>
    {state.error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{state.error}</p>}
    <section className="snp-card mt-5 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Lesson</th><th className="px-5 py-4">Level</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{state.lessons.map((lesson) => <tr key={lesson.id}><td className="px-5 py-4"><div className="flex items-center gap-1"><button className="grid h-8 w-8 place-items-center rounded-xl border-2 border-slate-800 bg-slate-50 hover:bg-slate-100 font-black disabled:opacity-30" disabled={!adjacent.get(lesson.id)?.previous || adjacent.get(lesson.id).previous.category !== lesson.category} onClick={() => void move(lesson, "up")} type="button">↑</button><span className="w-8 text-center font-black">{lesson.order}</span><button className="grid h-8 w-8 place-items-center rounded-xl border-2 border-slate-800 bg-slate-50 hover:bg-slate-100 font-black disabled:opacity-30" disabled={!adjacent.get(lesson.id)?.next || adjacent.get(lesson.id).next.category !== lesson.category} onClick={() => void move(lesson, "down")} type="button">↓</button></div></td><td className="px-5 py-4"><p className="font-black">{lesson.title}</p>{lesson.titleKhmer && <p className="mt-1 text-sm text-slate-500">{lesson.titleKhmer}</p>}<p className="mt-1 text-xs font-bold text-slate-400">{lesson.slug} · {lesson.category}</p></td><td className="px-5 py-4 font-bold">{lesson.language.toUpperCase()} · L{lesson.level}</td><td className="px-5 py-4 text-sm font-bold capitalize text-slate-600">{lesson.type}<br />{lesson.difficulty}</td><td className="px-5 py-4"><span className={`rounded-xl border-2 border-slate-800 px-3 py-1 text-xs font-black ${lesson.contentStatus === "needs_review" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>{lesson.contentStatus.replaceAll("_", " ")}</span><p className={`mt-2 text-xs font-black ${lesson.isPublished ? "text-primary-700" : "text-slate-400"}`}>{lesson.isPublished ? "Published" : "Unpublished"}</p></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button className="rounded-xl border-2 border-slate-800 bg-[#ecfdf5] px-3 py-2 text-xs font-black text-[#047857] shadow-[0_2px_0_0_#334155] active:translate-y-[1px] active:shadow-none hover:-translate-y-0.5 transition" onClick={() => setPreview(lesson)} type="button">Preview</button><button className="rounded-xl border-2 border-slate-800 bg-white px-3 py-2 text-xs font-black shadow-[0_2px_0_0_#334155] active:translate-y-[1px] active:shadow-none hover:-translate-y-0.5 transition" onClick={() => setEditor(toForm(lesson))} type="button">Edit</button><button className="rounded-xl border-2 border-slate-800 bg-white px-3 py-2 text-xs font-black shadow-[0_2px_0_0_#334155] active:translate-y-[1px] active:shadow-none hover:-translate-y-0.5 transition" onClick={async () => { await duplicateManagedLesson(lesson.id); await load(); }} type="button">Duplicate</button><button className="rounded-xl border-2 border-slate-800 bg-white px-3 py-2 text-xs font-black shadow-[0_2px_0_0_#334155] active:translate-y-[1px] active:shadow-none hover:-translate-y-0.5 transition" disabled={lesson.contentStatus === "needs_review" && !lesson.isPublished} onClick={async () => { await updateManagedLesson(lesson.id, { isPublished: !lesson.isPublished }); await load(); }} type="button">{lesson.isPublished ? "Unpublish" : "Publish"}</button><button className="rounded-xl border-2 border-slate-800 bg-red-50 px-3 py-2 text-xs font-black text-red-700 shadow-[0_2px_0_0_#334155] active:translate-y-[1px] active:shadow-none hover:-translate-y-0.5 transition" onClick={async () => { if (window.confirm(`Deactivate ${lesson.title}?`)) { await archiveManagedLesson(lesson.id); await load(); } }} type="button">Deactivate</button></div></td></tr>)}</tbody></table></div>{!state.lessons.length && <p className="p-10 text-center font-bold text-slate-500">No lessons match these filters.</p>}</section>
    {editor && <LessonForm initial={editor} onCancel={() => setEditor(null)} onSaved={async () => { setEditor(null); await load(); }} />}
    {preview && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-5"><div className="w-full max-w-3xl rounded-xl border-2 border-slate-800 bg-white p-7 shadow-[0_4px_0_0_#334155]"><div className="flex justify-between"><div><p className="text-xs font-extrabold uppercase tracking-wider text-primary-600">Lesson Preview</p><h2 className="mt-2 text-2xl font-black">{preview.title}</h2></div><button className="grid h-10 w-10 place-items-center rounded-xl border-2 border-slate-800 bg-slate-100 font-black hover:bg-slate-200 transition" onClick={() => setPreview(null)} type="button">×</button></div><p className="mt-4 text-sm font-bold text-slate-500">{preview.instructions}</p><div className="mt-5 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border-2 border-slate-800 bg-slate-50 p-6 text-xl font-semibold leading-10">{lessonContent(preview)}</div><p className="mt-4 text-sm font-black text-primary-700">{countLessonTargetGraphemes(preview)} grapheme characters</p><p className="mt-3 text-sm font-bold text-slate-500">Source: {preview.sourceBook || "Custom"}{preview.sourcePage ? ` · page ${preview.sourcePage}` : ""}{preview.sourceExercise ? ` · ${preview.sourceExercise}` : ""}</p></div></div>}
  </div>;
}
