import { useEffect, useState } from "react";
import { LuCircleCheckBig, LuHand, LuKeyboard, LuLogOut, LuMoon, LuSave, LuSettings, LuSparkles, LuType, LuVolume2 } from "react-icons/lu";
import { useNavigate } from "../components/NextRouter.jsx";

import { previewKeyboardSound } from "../features/typing/keyboardSound.js";
import PageHero from "../components/PageHero.jsx";
import { getApiErrorMessage } from "../services/api.js";
import { savePreferences } from "../services/settingsService.js";
import { useAuthStore } from "../stores/authStore.js";

const storageKey = "snp-learner-settings";
const defaults = {
  sound: true,
  soundStyle: "soft",
  soundVolume: 0.35,
  virtualKeyboard: true,
  handGuide: true,
  largeText: false,
  theme: "light",
};

function loadSettings() {
  try { return { ...defaults, ...JSON.parse(window.localStorage.getItem(storageKey)) }; }
  catch { return defaults; }
}

function ToggleRow({ checked, description, icon: Icon, label, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5 sm:gap-6 sm:p-6">
      <div className="flex min-w-0 items-start gap-3">{Icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-800 bg-[#ecfdf5] text-[#047857] shadow-[0_2px_0_0_#334155]"><Icon size={19} /></span>}<div><h2 className="font-black text-ink">{label}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{description}</p></div></div>
      <button className={`relative h-8 w-14 shrink-0 rounded-xl border-2 border-slate-800 transition-colors ${checked ? "bg-[#059669]" : "bg-slate-200"}`} aria-label={`Turn ${label.toLowerCase()} ${checked ? "off" : "on"}`} aria-pressed={checked} onClick={() => onChange(!checked)} type="button"><span className={`absolute top-0.5 h-6 w-6 rounded-xl border-2 border-slate-800 bg-white transition ${checked ? "left-7" : "left-0.5"}`} /></button>
    </div>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const local = loadSettings();
  const [settings, setSettings] = useState({
    ...local,
    sound: user?.preferences?.soundEnabled ?? local.sound,
    soundStyle: user?.preferences?.soundStyle ?? local.soundStyle,
    soundVolume: user?.preferences?.soundVolume ?? local.soundVolume,
    virtualKeyboard: user?.preferences?.virtualKeyboard ?? local.virtualKeyboard,
    handGuide: user?.preferences?.handGuide ?? local.handGuide,
    largeText: user?.preferences?.fontSize ? user.preferences.fontSize === "large" : local.largeText,
    theme: user?.preferences?.theme ?? local.theme,
  });
  const [status, setStatus] = useState({ saving: false, saved: false, error: "" });

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    document.documentElement.classList.toggle("snp-large-text", settings.largeText);
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("snp-dark", settings.theme === "dark" || (settings.theme === "system" && prefersDark));
  }, [settings.largeText, settings.theme]);

  function previewSound() {
    previewKeyboardSound({ enabled: settings.sound, style: settings.soundStyle, volume: settings.soundVolume });
  }

  async function savePersonal() {
    setStatus({ saving: true, saved: false, error: "" });
    try {
      const updatedUser = await savePreferences({
        soundEnabled: settings.sound,
        soundStyle: settings.soundStyle,
        soundVolume: Number(settings.soundVolume),
        virtualKeyboard: settings.virtualKeyboard,
        handGuide: settings.handGuide,
        fontSize: settings.largeText ? "large" : "normal",
        theme: settings.theme,
      });
      window.localStorage.setItem(storageKey, JSON.stringify(settings));
      setUser(updatedUser);
      setStatus({ saving: false, saved: true, error: "" });
    } catch (error) {
      setStatus({ saving: false, saved: false, error: getApiErrorMessage(error) });
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero
        badges={[
          { icon: LuKeyboard, label: "Keyboard guidance" },
          { icon: LuSparkles, label: "Accessible learning" },
        ]}
        description="Personalize typing feedback, on-screen guidance, readability, and the app theme. Your choices follow your learner account."
        eyebrow="Learning preferences"
        icon={LuSettings}
        title="Make SNP Typing yours"
        tone="emerald"
      />
      
      {/* Profile & Account Banner */}
      <section className="snp-card overflow-hidden bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 flex flex-col gap-5">
        <div className="flex items-center gap-4 text-left">
          <div className={`grid h-16 w-16 place-items-center rounded-xl border-2 border-slate-800 text-2xl font-black shadow-[0_3px_0_0_#334155] ${
            user?.gender === "male" ? "bg-sky-100 text-sky-800" :
            user?.gender === "female" ? "bg-rose-100 text-rose-800" :
            "bg-white text-slate-800"
          }`}>
            {user?.firstName?.slice(0, 1)?.toUpperCase() || "S"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-slate-800">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username}</h2>
              {user?.gender === "male" && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs font-extrabold text-sky-700">
                  ♂️ Male
                </span>
              )}
              {user?.gender === "female" && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs font-extrabold text-rose-700">
                  ♀️ Female
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold capitalize text-slate-500">
              Learner Account · ID: {user?.studentId || "Personal"}
            </p>
            {user?.khmerName && (
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                Khmer Name: {user.khmerName}
              </p>
            )}
          </div>
        </div>
        <button
          className="snp-button-secondary border-2 border-slate-800 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto px-5 py-2.5 text-sm font-bold flex items-center justify-center gap-2"
          onClick={handleLogout}
          type="button"
        >
          <LuLogOut size={16} /> Sign Out
        </button>
      </section>

      <section className="snp-card divide-y divide-slate-100 overflow-hidden">
        <ToggleRow checked={settings.sound} description="Play gentle key feedback during typing lessons and tests." icon={LuVolume2} label="Typing sounds" onChange={(value) => setSettings((current) => ({ ...current, sound: value }))} />
        <div className="grid gap-5 p-6 sm:grid-cols-[1fr_180px] sm:items-center">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-800 bg-[#ecfdf5] text-[#047857] shadow-[0_2px_0_0_#334155]"><LuVolume2 /></span><div><h2 className="font-black text-ink">Sound style</h2><p className="mt-1 text-sm text-slate-500">Choose a soft keyboard, classic typewriter, or playful bubble sound.</p></div></div>
          <div className="flex gap-2"><select className="snp-input min-w-0" disabled={!settings.sound} onChange={(event) => setSettings((current) => ({ ...current, soundStyle: event.target.value }))} value={settings.soundStyle}><option value="soft">Crisp Keyboard · Recommended</option><option value="typewriter">Classic Typewriter</option><option value="bubble">Bubble Pop</option></select><button className="snp-icon-button" disabled={!settings.sound} onClick={previewSound} title="Preview typing sound" type="button"><LuVolume2 /></button></div>
        </div>
        <label className="grid gap-5 p-6 sm:grid-cols-[1fr_220px] sm:items-center"><span><span className="block font-black text-ink">Sound volume</span><span className="mt-1 block text-sm text-slate-500">Adjust key sounds without changing Windows volume.</span></span><span className="flex items-center gap-3"><input className="w-full accent-sky-600" disabled={!settings.sound} max="1" min="0" onChange={(event) => setSettings((current) => ({ ...current, soundVolume: Number(event.target.value) }))} onPointerUp={previewSound} step="0.05" type="range" value={settings.soundVolume} /><b className="w-10 text-right text-sm text-slate-600">{Math.round(settings.soundVolume * 100)}%</b></span></label>
        <ToggleRow checked={settings.virtualKeyboard} description="Show the complete English or Khmer desktop keyboard under lessons." icon={LuKeyboard} label="Virtual keyboard" onChange={(value) => setSettings((current) => ({ ...current, virtualKeyboard: value }))} />
        <ToggleRow checked={settings.handGuide} description="Show which hand and finger should press the highlighted key." icon={LuHand} label="Hand and finger guide" onChange={(value) => setSettings((current) => ({ ...current, handGuide: value }))} />
        <ToggleRow checked={settings.largeText} description="Increase text size throughout the application." icon={LuType} label="Large text" onChange={(value) => setSettings((current) => ({ ...current, largeText: value }))} />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-slate-800 bg-[#ecfdf5] text-[#047857] shadow-[0_2px_0_0_#334155]"><LuMoon /></span><div><h2 className="font-black text-ink">Theme</h2><p className="mt-1 text-sm text-slate-500">Choose a light theme or follow the computer setting.</p></div></div><select className="snp-input sm:max-w-44" onChange={(event) => setSettings((current) => ({ ...current, theme: event.target.value }))} value={settings.theme}><option value="light">Light</option><option value="system">System</option><option value="dark">Dark</option></select></div>
      </section>
      <div className="flex flex-wrap items-center gap-4"><button className="snp-button-primary" disabled={status.saving} onClick={savePersonal} type="button"><LuSave />{status.saving ? "Saving…" : "Save my settings"}</button>{status.saved && <p className="inline-flex items-center gap-2 font-bold text-emerald-700"><LuCircleCheckBig />Settings saved.</p>}</div>
      {status.error && <p className="rounded-xl border-2 border-red-300 bg-red-50 p-4 font-bold text-red-700 shadow-[0_3px_0_0_#fca5a5]">{status.error}</p>}
    </div>
  );
}
