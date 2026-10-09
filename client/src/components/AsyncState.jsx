import { Alert, Button, Card, Empty, Result, Spin } from "antd";
import { LuKeyboard, LuRefreshCw } from "react-icons/lu";

export function PageLoader({ message = "Loading your lessons…" }) {
  return (
    <Card
      variant="outlined"
      className="grid min-h-[300px] place-items-center rounded-2xl shadow-sm dark:border-slate-800"
    >
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Spin size="large" />
        <p className="m-0 mt-4 text-base font-black text-slate-800 dark:text-slate-200">
          {message}
        </p>
        <p className="m-0 mt-1 text-xs font-semibold text-slate-400">
          Getting your learning space ready
        </p>
      </div>
    </Card>
  );
}

export function PageError({ message, onRetry }) {
  return (
    <Card
      variant="outlined"
      className="rounded-2xl border-red-200 bg-red-50/50 shadow-sm dark:border-red-900/40 dark:bg-red-950/20"
    >
      <Result
        status="error"
        title={<span className="font-black text-red-900 dark:text-red-300">We could not load this page</span>}
        subTitle={<span className="text-red-700 dark:text-red-400 font-medium">{message}</span>}
        extra={
          onRetry ? (
            <Button
              type="primary"
              danger
              onClick={onRetry}
              className="flex items-center gap-2 mx-auto font-bold"
            >
              <LuRefreshCw />
              <span>Try again</span>
            </Button>
          ) : undefined
        }
      />
    </Card>
  );
}

export function EmptyState({ title = "No data found", message = "Nothing to display here yet." }) {
  return (
    <Card
      variant="outlined"
      className="rounded-2xl p-6 text-center shadow-sm dark:border-slate-800"
    >
      <Empty
        description={
          <div>
            <h3 className="m-0 text-base font-black text-slate-800 dark:text-slate-200">
              {title}
            </h3>
            <p className="m-0 mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {message}
            </p>
          </div>
        }
      />
    </Card>
  );
}
