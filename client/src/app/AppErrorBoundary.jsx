import React from "react";
import { LuRefreshCw, LuTriangleAlert } from "react-icons/lu";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("SNP Typing renderer error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="snp-app-canvas grid min-h-screen place-items-center p-6">
          <section className="snp-result-dialog max-w-lg p-8 text-center" role="alert">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-red-200 bg-red-50 text-2xl text-red-600 shadow-md">
              <LuTriangleAlert />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-red-600">Application error</p>
            <h1 className="mt-2 text-2xl font-extrabold text-ink">
              SNP Typing could not open this screen
            </h1>
            <p className="mt-3 text-slate-600">
              Restart the application. If the problem continues, contact
              support for help.
            </p>
            <button
              className="snp-button-primary mt-6"
              type="button"
              onClick={() => window.location.reload()}
            >
              <LuRefreshCw />Restart screen
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
