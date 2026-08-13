import { useEffect, useState } from "react";
import { LuCircleAlert, LuKeyboard, LuLanguages, LuLockKeyhole, LuLogIn, LuShieldCheck, LuSparkles, LuStar, LuUser } from "react-icons/lu";
import { useSearchParams } from "next/navigation";

import { Navigate, useNavigate } from "../components/NextRouter.jsx";

import Brand from "../components/Brand.jsx";
import { apiConfigurationError } from "../services/api.js";
import { useAuthStore } from "../stores/authStore.js";

const featureKeys = [[LuKeyboard, "English"], [LuLanguages, "ខ្មែរ"], [LuStar, "Progress"]];

export default function LoginPage() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestedDestination = searchParams.get("next");
  const destination = requestedDestination?.startsWith("/")
    && !requestedDestination.startsWith("//")
    ? requestedDestination
    : "/";

  useEffect(() => clearError, [clearError]);
  if (status === "authenticated") return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    const authenticated = await login(credentials);
    setIsSubmitting(false);
    if (authenticated) {
      sessionStorage.setItem("snp-just-logged-in", "true");
      navigate(destination, { replace: true });
    }
  }

  function updateField(event) {
    clearError();
    setCredentials((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <main className="snp-auth-page min-h-screen p-3 sm:p-5 lg:p-8">
      <div className="snp-auth-shell mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="snp-auth-visual relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div className="relative z-10"><Brand inverse /></div>
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border-[42px] border-violet-400/30" /><div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="relative z-10 max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-200 backdrop-blur"><LuSparkles /> Your daily learning space</span>
            <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-[-0.04em] text-white xl:text-6xl">Type smarter.<br /><span className="text-emerald-300">Learn faster.</span></h1>
            <p className="mt-5 max-w-md text-base font-medium leading-7 text-slate-300">Build confident English and Khmer typing skills through focused lessons, practice, and games.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {featureKeys.map(([Icon, label]) => <span className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white backdrop-blur" key={label}><Icon className="text-emerald-300" />{label}</span>)}
            </div>
          </div>
          <div className="absolute bottom-4 right-4 z-0 xl:bottom-8 xl:right-8">
            <img 
              alt="Hands typing on a keyboard" 
              className="h-64 w-64 object-contain drop-shadow-2xl xl:h-80 xl:w-80" 
              src="/login-illustration.png" 
            />
          </div>
        </section>
 
        <section className="snp-auth-form-panel flex items-center justify-center p-5 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden"><Brand /></div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-primary-700"><LuStar fill="currentColor" /> Welcome back</span><h2 className="mt-5 text-4xl font-black tracking-[-0.035em] text-ink sm:text-5xl">Sign in to learn</h2><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Use the username and password provided by your teacher.</p>
            {apiConfigurationError && <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900" role="alert"><LuCircleAlert className="mt-0.5 shrink-0" size={19} /><span>{apiConfigurationError} Ask the administrator to rebuild the application with the school server address.</span></div>}
            {error && <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert"><LuCircleAlert className="mt-0.5 shrink-0" size={19} /><span>{error}</span></div>}
            <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
              <div><label className="snp-label" htmlFor="username">Username</label><div className="relative"><LuUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input autoCapitalize="none" autoComplete="username" className="snp-input pl-11" id="username" maxLength={64} name="username" onChange={updateField} placeholder="Enter your username" required spellCheck="false" value={credentials.username} /></div></div>
              <div><label className="snp-label" htmlFor="password">Password</label><div className="relative"><LuLockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input autoComplete="current-password" className="snp-input pl-11" id="password" minLength={8} name="password" onChange={updateField} placeholder="Enter your password" required type="password" value={credentials.password} /></div></div>
              <button className="snp-button-primary w-full" disabled={isSubmitting || Boolean(apiConfigurationError)} type="submit">{isSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Signing in…</> : <><LuLogIn />Sign in</>}</button>
            </form>
            <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-slate-500"><LuShieldCheck className="shrink-0 text-primary-600" />Need help? Ask your teacher to check your account.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
