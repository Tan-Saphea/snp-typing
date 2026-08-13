import { Link } from "../components/NextRouter.jsx";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="snp-card max-w-lg p-8 text-center">
        <p className="text-6xl font-black text-primary-600">404</p>
        <h1 className="mt-3 text-3xl font-black text-ink">Page not found</h1>
        <p className="mt-4 text-slate-600">
          The requested SNP Typing screen does not exist.
        </p>
        <Link className="snp-button-primary mt-6" to="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
