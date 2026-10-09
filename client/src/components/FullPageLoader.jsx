import { Card, Spin } from "antd";
import Brand from "./Brand.jsx";

export default function FullPageLoader({ message = "Loading…" }) {
  return (
    <main
      className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-slate-950"
      aria-busy="true"
    >
      <Card
        variant="outlined"
        className="w-full max-w-sm rounded-3xl p-6 text-center shadow-xl dark:border-slate-800"
      >
        <div className="flex justify-center mb-6">
          <Brand />
        </div>
        <Spin size="large" />
        <p className="m-0 mt-5 font-black text-slate-800 dark:text-slate-200">
          {message}
        </p>
        <p className="m-0 mt-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          SNP Typing
        </p>
      </Card>
    </main>
  );
}
