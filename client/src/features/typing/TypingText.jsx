import { memo, useEffect, useRef } from "react";

const stateClasses = {
  correct: "text-emerald-600 dark:text-emerald-400",
  incorrect: "rounded bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 underline decoration-2 underline-offset-4",
  current: "rounded-[4px] bg-amber-200 dark:bg-amber-400 text-slate-900 dark:text-slate-950 ring-2 ring-amber-500",
  untyped: "text-slate-400 dark:text-slate-500",
};

function TypingText({ targetSegments, currentIndex, hasCurrentError = false, language, viewport = false }) {
  const containerRef = useRef(null);
  const currentRef = useRef(null);

  useEffect(() => {
    if (!viewport || !containerRef.current || !currentRef.current) return;
    const container = containerRef.current;
    const current = currentRef.current;
    const safeTop = container.scrollTop + container.clientHeight * 0.3;
    const safeBottom = container.scrollTop + container.clientHeight * 0.7;
    if (current.offsetTop < safeTop || current.offsetTop + current.clientHeight > safeBottom) {
      const targetTop = Math.max(0, current.offsetTop - (container.clientHeight / 2) + (current.clientHeight / 2));
      container.scrollTo({ top: targetTop, behavior: "auto" });
    }
  }, [currentIndex, viewport]);

  return (
    <div
      ref={containerRef}
      className={`snp-scrollbar select-none whitespace-pre-wrap break-words text-[clamp(1.35rem,3.4vh,1.85rem)] font-bold leading-[1.75] tracking-wide ${viewport ? "snp-typing-text-viewport h-full overflow-y-auto overscroll-contain px-2 py-4" : ""} ${language === "km" ? "font-sans" : ""}`}
      aria-label="Typing target"
    >
      {targetSegments.map((segment, index) => {
        let state = "untyped";
        if (index < currentIndex) state = "correct";
        else if (index === currentIndex) state = hasCurrentError ? "incorrect" : "current";
        return (
          <span
            className={`${stateClasses[state]} px-[1px]`}
            data-state={state}
            key={`${index}-${segment}`}
            ref={index === currentIndex ? currentRef : undefined}
          >
            {segment}
          </span>
        );
      })}
    </div>
  );
}

export default memo(TypingText);
