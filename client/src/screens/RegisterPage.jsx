import { useEffect, useState } from "react";
import {
  LuArrowLeft,
  LuCircleAlert,
  LuEye,
  LuEyeOff,
  LuKeyboard,
  LuLanguages,
  LuLockKeyhole,
  LuShieldCheck,
  LuSparkles,
  LuUser,
  LuUserPlus,
} from "react-icons/lu";

import { Link, Navigate, useNavigate } from "../components/NextRouter.jsx";
import Brand from "../components/Brand.jsx";
import { apiConfigurationError } from "../services/api.js";
import { useAuthStore } from "../stores/authStore.js";

const initialProfile = {
  firstName: "",
  lastName: "",
  khmerName: "",
  gender: "unspecified",
  username: "",
  password: "",
  confirmPassword: "",
};

const usernamePattern = /^[a-z0-9._-]+$/;

function validateProfile(profile) {
  const username = profile.username.trim().toLowerCase();

  if (!profile.firstName.trim()) return "Enter your first name.";
  if (username.length < 3) return "Username: use at least 3 characters.";
  if (!usernamePattern.test(username)) return "Username: use only letters, numbers, dots, underscores, or hyphens.";
  if (profile.password.length < 8) return "Password: use at least 8 characters.";
  if (!/[a-z]/.test(profile.password)) return "Password: include at least one lowercase letter.";
  if (!/[A-Z]/.test(profile.password)) return "Password: include at least one uppercase letter.";
  if (!/[0-9]/.test(profile.password)) return "Password: include at least one number.";
  if (profile.password !== profile.confirmPassword) return "The passwords do not match.";
  return "";
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const register = useAuthStore((state) => state.register);
  const clearError = useAuthStore((state) => state.clearError);
  const [profile, setProfile] = useState(initialProfile);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => clearError, [clearError]);
  if (status === "authenticated") return <Navigate to="/" replace />;

  function updateField(event) {
    clearError();
    setFormError("");
    const value = event.target.name === "username"
      ? event.target.value.toLowerCase()
      : event.target.value;
    setProfile((current) => ({ ...current, [event.target.name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateProfile(profile);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    const registration = {
      ...profile,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      khmerName: profile.khmerName.trim(),
      username: profile.username.trim().toLowerCase(),
    };
    delete registration.confirmPassword;
    const registered = await register(registration);
    setIsSubmitting(false);

    if (registered) {
      sessionStorage.setItem("snp-just-logged-in", "true");
      navigate("/", { replace: true });
    }
  }

  return (
    <main className="snp-auth-page min-h-screen p-3 sm:p-5 lg:p-8">
      <div className="snp-auth-shell mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[0.84fr_1.16fr]">
        <section className="snp-auth-visual relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
          <Brand inverse />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border-[42px] border-violet-400/30" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-200 backdrop-blur"><LuSparkles /> Start your path</span>
            <h1 className="mt-6 text-5xl font-black leading-[1.04] tracking-[-0.04em] text-white">Your account.<br /><span className="text-emerald-300">Your progress.</span></h1>
            <p className="mt-5 max-w-md font-medium leading-7 text-slate-300">Create a private learner account, complete lessons in order, and keep every result in one place.</p>
            <div className="mt-7 grid gap-3">
              <span className="inline-flex items-center gap-3 font-bold"><LuKeyboard className="text-emerald-300" />English and Khmer typing paths</span>
              <span className="inline-flex items-center gap-3 font-bold"><LuLanguages className="text-emerald-300" />Step-by-step lesson unlocking</span>
              <span className="inline-flex items-center gap-3 font-bold"><LuShieldCheck className="text-emerald-300" />Progress saved to your account</span>
            </div>
          </div>
          <p className="relative z-10 text-sm font-semibold text-slate-400">Pass each lesson with the required accuracy to unlock the next one.</p>
        </section>

        <section className="snp-auth-form-panel flex items-center justify-center p-5 sm:p-10 lg:p-12">
          <div className="w-full max-w-2xl">
            <div className="mb-7 flex items-center justify-between gap-4">
              <div className="lg:hidden"><Brand /></div>
              <Link className="inline-flex items-center gap-2 text-sm font-black text-primary-700 hover:underline" to="/login"><LuArrowLeft />Sign in</Link>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-800"><LuUserPlus /> New learner</span>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.035em] text-ink sm:text-5xl">Create your account</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Choose your own username and a strong password. You will be signed in immediately.</p>

            {apiConfigurationError && <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900" role="alert"><LuCircleAlert className="mt-0.5 shrink-0" size={19} /><span>{apiConfigurationError}</span></div>}
            {(formError || error) && <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert"><LuCircleAlert className="mt-0.5 shrink-0" size={19} /><span>{formError || error}</span></div>}

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label className="snp-label" htmlFor="firstName">First name</label><input autoComplete="given-name" className="snp-input" id="firstName" maxLength={80} name="firstName" onChange={updateField} placeholder="Sovann" required value={profile.firstName} /></div>
                <div><label className="snp-label" htmlFor="lastName">Last name <span className="font-semibold text-slate-400">(optional)</span></label><input autoComplete="family-name" className="snp-input" id="lastName" maxLength={80} name="lastName" onChange={updateField} placeholder="Kim" value={profile.lastName} /></div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label className="snp-label" htmlFor="khmerName">Khmer name <span className="font-semibold text-slate-400">(optional)</span></label><input className="snp-input" id="khmerName" lang="km" maxLength={160} name="khmerName" onChange={updateField} placeholder="សុវណ្ណ គឹម" value={profile.khmerName} /></div>
                <div><label className="snp-label" htmlFor="gender">Gender</label><select className="snp-input" id="gender" name="gender" onChange={updateField} value={profile.gender}><option value="unspecified">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></div>
              </div>
              <div><label className="snp-label" htmlFor="username">Username</label><div className="relative"><LuUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input autoCapitalize="none" autoComplete="username" className="snp-input pl-11" id="username" maxLength={64} minLength={3} name="username" onChange={updateField} pattern={"[a-z0-9._\\-]+"} placeholder="sovann.kim" required spellCheck="false" title="Use lowercase letters, numbers, dots, underscores, or hyphens." value={profile.username} /></div><p className="mt-1.5 text-xs font-semibold text-slate-500">Lowercase letters, numbers, dots, underscores, or hyphens.</p></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div><label className="snp-label" htmlFor="password">Password</label><div className="relative"><LuLockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input autoComplete="new-password" className="snp-input px-11" id="password" maxLength={128} minLength={8} name="password" onChange={updateField} placeholder="Create a password" required type={showPassword ? "text" : "password"} value={profile.password} /><button aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800" onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <LuEyeOff /> : <LuEye />}</button></div></div>
                <div><label className="snp-label" htmlFor="confirmPassword">Confirm password</label><input autoComplete="new-password" className="snp-input" id="confirmPassword" maxLength={128} minLength={8} name="confirmPassword" onChange={updateField} placeholder="Type it again" required type={showPassword ? "text" : "password"} value={profile.confirmPassword} /></div>
              </div>
              <p className="text-xs font-semibold text-slate-500">Use at least 8 characters with an uppercase letter, lowercase letter, and number.</p>
              <button className="snp-button-primary w-full" disabled={isSubmitting || Boolean(apiConfigurationError)} type="submit">{isSubmitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Creating account…</> : <><LuUserPlus />Create account and start</>}</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
