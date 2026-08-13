import { useEffect, useState } from "react";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { createClass, listClasses, updateClass } from "../services/managementService.js";

export default function ClassesPage() {
  const [state, setState] = useState({ loading: true, classes: [], error: "" });
  const [form, setForm] = useState({ name: "", level: "", academicYear: "2026-2027", freePracticeMode: false });
  async function load() { try { setState({ loading: false, classes: await listClasses(), error: "" }); } catch (error) { setState({ loading: false, classes: [], error: getApiErrorMessage(error) }); } }
  useEffect(() => { void load(); }, []);
  if (state.loading) return <PageLoader />;
  if (state.error) return <PageError message={state.error} onRetry={load} />;
  async function submit(event) { event.preventDefault(); await createClass(form); setForm({ name: "", level: "", academicYear: "2026-2027", freePracticeMode: false }); await load(); }
  return (
    <div>
      <p className="text-sm font-extrabold uppercase tracking-wider text-[#047857]">
        Class Management
      </p>
      <h1 className="mt-2 text-3xl font-black">Classes</h1>
      
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        {/* Create Class Form */}
        <form className="snp-brutal-card-slate h-fit p-6" onSubmit={submit}>
          <h2 className="text-xl font-black">Create Class</h2>
          {[
            ["name", "Class Name"],
            ["level", "Level"],
            ["academicYear", "Academic Year"]
          ].map(([name, label]) => (
            <label className="snp-label mt-4" key={name}>
              {label}
              <input 
                className="snp-input mt-2" 
                onChange={(event) => setForm((value) => ({ ...value, [name]: event.target.value }))} 
                required 
                value={form[name]} 
              />
            </label>
          ))}
          
          <label className="mt-5 flex items-center gap-3 font-bold cursor-pointer">
            <input 
              checked={form.freePracticeMode} 
              className="h-5 w-5 rounded-xl border-2 border-slate-800 text-[#059669] focus:ring-[#059669] transition cursor-pointer" 
              onChange={(event) => setForm((value) => ({ ...value, freePracticeMode: event.target.checked }))} 
              type="checkbox" 
            />
            Free Practice Mode
          </label>
          
          <button className="snp-button-primary mt-5 w-full" type="submit">
            Create Class
          </button>
        </form>
        
        {/* Class List */}
        <div className="space-y-4">
          {state.classes.map((item) => (
            <article className="snp-card p-5" key={item._id}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.level} · {item.academicYear} · {item.students.length} students
                  </p>
                </div>
                <span className="rounded-xl bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
                  {item.status}
                </span>
              </div>
              
              <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-black">Free Practice Mode</p>
                  <p className="text-sm text-slate-500">
                    Allow students to open lessons without prerequisites.
                  </p>
                </div>
                <button className={`relative h-8 w-14 rounded-xl border-2 border-slate-800 transition-colors ${item.freePracticeMode ? "bg-[#059669]" : "bg-slate-200"}`} onClick={async () => { await updateClass(item._id, { freePracticeMode: !item.freePracticeMode }); await load(); }} type="button"><span className={`absolute top-0.5 h-6 w-6 rounded-xl border-2 border-slate-800 bg-white transition ${item.freePracticeMode ? "left-7" : "left-0.5"}`} /></button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
