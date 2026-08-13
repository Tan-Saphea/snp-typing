import React from "react";

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
        <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
          <section className="snp-card max-w-lg p-8 text-center" role="alert">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-2xl">
              !
            </div>
            <h1 className="text-2xl font-extrabold text-ink">
              SNP Typing could not open this screen
            </h1>
            <p className="mt-3 text-slate-600">
              Restart the application. If the problem continues, ask your
              teacher or administrator for help.
            </p>
            <button
              className="snp-button-primary mt-6"
              type="button"
              onClick={() => window.location.reload()}
            >
              Restart screen
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
