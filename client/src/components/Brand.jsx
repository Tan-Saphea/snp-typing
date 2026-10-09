export default function Brand({ compact = false, inverse = false }) {
  return (
    <div className="flex items-center gap-3 select-none" aria-label="SNP Typing">
      <img
        src="/logo.png"
        alt="SNP Logo"
        className="h-10 w-10 shrink-0 object-contain"
      />
      {!compact && (
        <div className="min-w-0">
          <p
            className={`text-base font-black leading-tight tracking-tight m-0 ${
              inverse ? "text-white" : "text-slate-900 dark:text-white"
            }`}
          >
            SNP Typing
          </p>
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.14em] m-0 ${
              inverse ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            Learning workspace
          </p>
        </div>
      )}
    </div>
  );
}
