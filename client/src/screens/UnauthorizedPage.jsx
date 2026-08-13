import { Link } from "../components/NextRouter.jsx";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="snp-card max-w-lg p-8 text-center">
        <p className="text-sm font-extrabold uppercase tracking-widest text-primary-600">
          Access protected
        </p>
        <h1 className="mt-3 text-3xl font-black text-ink">
          This page is not available for your account
        </h1>
        <p className="mt-4 text-slate-600">
          Return to your dashboard or ask an administrator if your role is not
          correct.
        </p>
        <Link className="snp-button-primary mt-6" to="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
