import { useEffect, useState } from "react";
import { Link } from "../components/NextRouter.jsx";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { listLessons } from "../services/lessonService.js";

export default function ComputerSkillsPage() {
  const [state, setState] = useState({ loading: true, lessons: [], error: "" });
  useEffect(() => { listLessons({ type: "computer-skill" }).then((lessons) => setState({ loading: false, lessons, error: "" })).catch((error) => setState({ loading: false, lessons: [], error: getApiErrorMessage(error) })); }, []);
  if (state.loading) return <PageLoader />;
  if (state.error) return <PageError message={state.error} />;
  return (
    <div>
      <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#047857]">
        Microsoft Word Skills
      </p>
      <h1 className="mt-2 text-3xl font-black">Computer Skills</h1>
      <p className="mt-2 text-slate-600">
        Type, edit, and format documents in a safe learning workspace.
      </p>
      
      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        {state.lessons.map((lesson, index) => (
          <article
            className={`snp-card flex items-center gap-4 p-5 ${
              lesson.isLocked ? "opacity-70" : ""
            }`}
            key={lesson.id}
          >
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl font-black ${
                lesson.progress.passed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-emerald-50 text-[#047857]"
              }`}
            >
              {lesson.progress.passed ? "✓" : index + 1}
            </div>
            
            <div class="min-w-0 flex-1">
              <h2 class="font-black text-lg">{lesson.title}</h2>
              <p class="mt-1 truncate text-sm opacity-90">{lesson.instructions}</p>
            </div>
            
            {lesson.isLocked ? (
              <span className="text-sm font-black text-slate-400">Locked</span>
            ) : (
              <Link
                className="snp-brutal-button-sm px-4 py-2 text-sm"
                to={`/computer-skills/${lesson.id}`}
              >
                Open
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
