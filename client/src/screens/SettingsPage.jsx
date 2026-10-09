import { useEffect, useState } from "react";
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Input,
  Modal,
  Row,
  Select,
  Slider,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  LuCircleCheckBig,
  LuHand,
  LuKeyRound,
  LuKeyboard,
  LuLock,
  LuLogOut,
  LuMoon,
  LuSave,
  LuSettings,
  LuShieldAlert,
  LuShieldCheck,
  LuSparkles,
  LuType,
  LuLockKeyholeOpen,
  LuUser,
  LuVolume2,
} from "react-icons/lu";

import PageHero from "../components/PageHero.jsx";
import { useNavigate } from "../components/NextRouter.jsx";
import { previewKeyboardSound } from "../features/typing/keyboardSound.js";
import { getApiErrorMessage } from "../services/api.js";
import { savePreferences } from "../services/settingsService.js";
import { useAuthStore } from "../stores/authStore.js";
import { useTheme } from "../theme/ThemeContext.jsx";

const { Text, Title } = Typography;

const SUPER_GUEST_PASSWORD = "Superguest.snpis123!@#";

const storageKey = "snp-learner-settings";
const defaults = {
  sound: true,
  soundStyle: "soft",
  soundVolume: 0.35,
  virtualKeyboard: true,
  handGuide: true,
  largeText: false,
  theme: "light",
  superGuest: false,
};

function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(window.localStorage.getItem(storageKey)) };
  } catch {
    return defaults;
  }
}

export default function SettingsPage() {
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const local = loadSettings();
  const { theme, setTheme, largeText, setLargeText } = useTheme();

  const [settings, setSettings] = useState({
    ...local,
    sound: user?.preferences?.soundEnabled ?? local.sound,
    soundStyle: user?.preferences?.soundStyle ?? local.soundStyle,
    soundVolume: user?.preferences?.soundVolume ?? local.soundVolume,
    virtualKeyboard: user?.preferences?.virtualKeyboard ?? local.virtualKeyboard,
    handGuide: user?.preferences?.handGuide ?? local.handGuide,
    largeText: user?.preferences?.fontSize
      ? user.preferences.fontSize === "large"
      : largeText,
    theme: user?.preferences?.theme ?? theme ?? local.theme,
    superGuest: user?.preferences?.superGuest ?? local.superGuest ?? false,
  });

  useEffect(() => {
    if (theme && settings.theme !== theme) {
      setSettings((s) => ({ ...s, theme }));
    }
  }, [theme]);

  const [status, setStatus] = useState({ saving: false, saved: false, error: "" });

  // Super Guest password modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function previewSound() {
    previewKeyboardSound({
      enabled: settings.sound,
      style: settings.soundStyle,
      volume: settings.soundVolume,
    });
  }

  const handleThemeChange = (val) => {
    setSettings((c) => ({ ...c, theme: val }));
    setTheme(val);
  };

  const handleLargeTextToggle = (checked) => {
    setSettings((c) => ({ ...c, largeText: checked }));
    setLargeText(checked);
  };

  async function savePreferencesToApi(nextSettings) {
    const updatedUser = await savePreferences({
      soundEnabled: nextSettings.sound,
      soundStyle: nextSettings.soundStyle,
      soundVolume: Number(nextSettings.soundVolume),
      virtualKeyboard: nextSettings.virtualKeyboard,
      handGuide: nextSettings.handGuide,
      fontSize: nextSettings.largeText ? "large" : "normal",
      theme: nextSettings.theme,
      superGuest: Boolean(nextSettings.superGuest),
    });
    window.localStorage.setItem(storageKey, JSON.stringify(nextSettings));
    setUser(updatedUser);
    setTheme(nextSettings.theme);
    setLargeText(nextSettings.largeText);
    return updatedUser;
  }

  async function savePersonal() {
    setStatus({ saving: true, saved: false, error: "" });
    try {
      if (user) {
        await savePreferencesToApi(settings);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(settings));
        setTheme(settings.theme);
        setLargeText(settings.largeText);
        window.dispatchEvent(new Event("snp-settings-changed"));
      }
      setStatus({ saving: false, saved: true, error: "" });
      message.success("Settings saved successfully!");
    } catch (error) {
      window.localStorage.setItem(storageKey, JSON.stringify(settings));
      setTheme(settings.theme);
      setLargeText(settings.largeText);
      window.dispatchEvent(new Event("snp-settings-changed"));
      setStatus({ saving: false, saved: false, error: getApiErrorMessage(error) });
      message.error(getApiErrorMessage(error));
    }
  }

  // Handle Super Guest switch toggle
  function handleSuperGuestToggle(checked) {
    if (checked) {
      setPasswordInput("");
      setPasswordError("");
      setModalOpen(true);
    } else {
      const next = { ...settings, superGuest: false };
      setSettings(next);
      savePreferencesToApi(next)
        .then(() => {
          message.info("បានបិទ Super Guest Mode។ កម្រិតមេរៀនត្រឡប់ទៅដំណើរការតាមលំដាប់ធម្មតា។");
        })
        .catch((err) => {
          message.error(getApiErrorMessage(err));
        });
    }
  }

  // Handle Super Guest Password verification
  async function handleVerifySuperGuestPassword(e) {
    if (e && e.preventDefault) e.preventDefault();
    const cleanInput = String(passwordInput ?? "").trim();
    if (!cleanInput) {
      setPasswordError("សូមបញ្ចូលពាក្យសម្ងាត់ Super Key / Super Guest (Please enter password)");
      return;
    }

    const isValidPassword =
      cleanInput === "Superguest.snpis123!@#" ||
      cleanInput === "Admin.snpis@2013" ||
      cleanInput.toLowerCase() === "admin.snpis@2013" ||
      cleanInput.toLowerCase() === "superguest.snpis123!@#";

    if (isValidPassword) {
      setVerifying(true);
      setPasswordError("");
      try {
        const next = { ...settings, superGuest: true };
        setSettings(next);
        await savePreferencesToApi(next);
        setModalOpen(false);
        setPasswordInput("");
        message.success("បានបើក Super Guest Mode ជោគជ័យ! មេរៀនទាំងអស់ត្រូវបានដោះសោ (All Lessons Unlocked)");
      } catch (error) {
        setPasswordError(getApiErrorMessage(error));
      } finally {
        setVerifying(false);
      }
    } else {
      setPasswordError("ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ! សូមព្យាយាមម្តងទៀត (Incorrect password)");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero
        badges={[
          { icon: LuKeyboard, label: "Interactive feedback" },
          { icon: LuSparkles, label: "Personalized workspace" },
        ]}
        description="Personalize typing audio, on-screen guidance, typography scale, and theme preferences. Your choices follow your learner account."
        eyebrow="Preferences"
        icon={LuSettings}
        title="Settings & Preferences"
        tone="emerald"
      />

      {/* Profile & Account Banner Card */}
      <Card
        variant="outlined"
        className="rounded-2xl shadow-sm dark:border-slate-800"
        styles={{ body: { padding: "24px" } }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar
              size={64}
              className={`text-2xl font-black ${
                user?.gender === "male"
                  ? "bg-sky-500 text-white"
                  : user?.gender === "female"
                  ? "bg-rose-500 text-white"
                  : "bg-[#52c41a] text-white"
              }`}
            >
              {user?.firstName?.slice(0, 1)?.toUpperCase() || <LuUser size={28} />}
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 text-xl font-black text-slate-900 dark:text-white">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username}
                </h3>
                {user?.gender === "male" && (
                  <Tag color="blue" className="rounded-md font-bold">Male</Tag>
                )}
                {user?.gender === "female" && (
                  <Tag color="magenta" className="rounded-md font-bold">Female</Tag>
                )}
                {settings.superGuest && (
                  <Tag color="gold" className="rounded-md font-bold flex items-center gap-1">
                    <LuLockKeyholeOpen size={12} /> Super Guest (All Unlocked)
                  </Tag>
                )}
              </div>
              <p className="m-0 mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                Learner Account · ID: {user?.studentId || "Personal"}
              </p>
              {user?.khmerName && (
                <p className="m-0 mt-0.5 text-xs font-bold text-[#52c41a]">
                  Khmer: {user.khmerName}
                </p>
              )}
            </div>
          </div>

          <Button
            danger
            icon={<LuLogOut size={16} />}
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 font-bold h-10 px-5"
          >
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Super Guest Access Card */}
      <Card
        variant="outlined"
        className={`rounded-2xl shadow-sm transition-all duration-200 ${
          settings.superGuest
            ? "border-amber-400 bg-amber-500/5 dark:border-amber-600/50"
            : "border-slate-200 dark:border-slate-800"
        }`}
        styles={{ body: { padding: "20px 24px" } }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                settings.superGuest
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {settings.superGuest ? <LuLockKeyholeOpen size={22} /> : <LuKeyRound size={22} />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="m-0 text-base font-bold text-slate-900 dark:text-white">
                  Super Guest Mode (ដោះសោមេរៀនទាំងអស់)
                </h4>
                {settings.superGuest ? (
                  <Tag color="success" className="font-bold rounded-md">
                    ACTIVE (ALL UNLOCKED)
                  </Tag>
                ) : (
                  <Tag color="default" className="font-bold rounded-md text-slate-400">
                    LOCKED MODE
                  </Tag>
                )}
              </div>
              <p className="m-0 mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                បើកមុខងារនេះដើម្បីចូលរៀន និងវាយមេរៀនគ្រប់ Level ទាំងអស់ភ្លាមៗ ដោយមិនចាំបាច់រង់ចាំប្រឡងជាប់មេរៀនមុន (Unlocks all Khmer & English lessons without prerequisites).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Switch
              checked={settings.superGuest}
              onChange={handleSuperGuestToggle}
              className={settings.superGuest ? "bg-amber-500" : ""}
            />
          </div>
        </div>
      </Card>

      {/* Main Settings Card */}
      <Card
        variant="outlined"
        title={<span className="text-base font-black">Typing & Appearance Options</span>}
        className="rounded-2xl shadow-sm dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800"
        styles={{ body: { padding: "0" } }}
      >
        {/* Typing Sounds */}
        <div className="flex items-center justify-between p-6 gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-[#52c41a]">
              <LuVolume2 size={20} />
            </div>
            <div>
              <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
                Typing Sounds
              </h4>
              <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed">
                Play auditory feedback during typing lessons and tests.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.sound}
            onChange={(checked) => setSettings((c) => ({ ...c, sound: checked }))}
          />
        </div>

        {/* Sound Style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-[#52c41a]">
              <LuVolume2 size={20} />
            </div>
            <div>
              <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
                Sound Style
              </h4>
              <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed">
                Choose a sound feedback style that suits your focus.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              disabled={!settings.sound}
              value={settings.soundStyle}
              onChange={(val) => setSettings((c) => ({ ...c, soundStyle: val }))}
              style={{ width: 220 }}
              options={[
                { value: "soft", label: "Crisp Keyboard (Recommended)" },
                { value: "thock", label: "Deep Thock (Mechanical)" },
                { value: "mechanical", label: "Clicky Blue Switch" },
                { value: "typewriter", label: "Classic Typewriter" },
                { value: "bubble", label: "Bubble Pop" },
              ]}
            />
            <Button
              disabled={!settings.sound}
              icon={<LuVolume2 size={16} />}
              onClick={previewSound}
              title="Preview Sound"
            />
          </div>
        </div>

        {/* Sound Volume Slider */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
              Sound Volume
            </h4>
            <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed">
              Adjust key feedback volume without changing computer volume.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-64">
            <Slider
              min={0}
              max={1}
              step={0.05}
              disabled={!settings.sound}
              value={settings.soundVolume}
              onChange={(val) => setSettings((c) => ({ ...c, soundVolume: val }))}
              className="flex-1"
            />
            <span className="w-12 text-right text-xs font-bold text-slate-600 dark:text-slate-400">
              {Math.round(settings.soundVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Virtual Keyboard */}
        <div className="flex items-center justify-between p-6 gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-[#52c41a]">
              <LuKeyboard size={20} />
            </div>
            <div>
              <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
                Virtual Keyboard
              </h4>
              <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed">
                Display the on-screen English or Khmer keyboard guide under lessons.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.virtualKeyboard}
            onChange={(checked) => setSettings((c) => ({ ...c, virtualKeyboard: checked }))}
          />
        </div>

        {/* Hand Guide */}
        <div className="flex items-center justify-between p-6 gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-[#52c41a]">
              <LuHand size={20} />
            </div>
            <div>
              <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
                Hand & Finger Guide
              </h4>
              <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed">
                Show visual indicators for recommended fingers for each highlighted key.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.handGuide}
            onChange={(checked) => setSettings((c) => ({ ...c, handGuide: checked }))}
          />
        </div>

        {/* Large Text */}
        <div className="flex items-center justify-between p-6 gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-[#52c41a]">
              <LuType size={20} />
            </div>
            <div>
              <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
                Large Text Mode
              </h4>
              <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed">
                Increase typography size throughout the interface for easier reading.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.largeText}
            onChange={handleLargeTextToggle}
          />
        </div>

        {/* App Theme */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-[#52c41a]">
              <LuMoon size={20} />
            </div>
            <div>
              <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
                Interface Theme
              </h4>
              <p className="m-0 mt-1 text-xs text-slate-500 leading-relaxed">
                Choose clean Light mode, Dark mode, or follow system appearance.
              </p>
            </div>
          </div>
          <Select
            value={settings.theme}
            onChange={handleThemeChange}
            style={{ width: 220 }}
            options={[
              { value: "light", label: "Light Mode (ពន្លឺ)" },
              { value: "dark", label: "Dark Mode (ងងឹត)" },
              { value: "system", label: "System Mode (តាមប្រព័ន្ធ)" },
            ]}
          />
        </div>
      </Card>

      {/* Save Action */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="primary"
          size="large"
          loading={status.saving}
          onClick={savePersonal}
          className="flex items-center gap-2 font-bold px-6 h-11"
        >
          <LuSave size={18} />
          <span>Save Preferences</span>
        </Button>
      </div>

      {/* Super Guest Password Verification Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setPasswordInput("");
          setPasswordError("");
        }}
        footer={null}
        centered
        width={460}
        styles={{ body: { padding: "8px 4px 16px 4px" } }}
      >
        <div className="text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5">
            <LuKeyRound size={32} />
          </div>

          <div>
            <h3 className="m-0 text-lg font-black text-slate-900 dark:text-white">
              Super Guest Authentication
            </h3>
            <p className="m-0 mt-1 text-xs text-slate-500 dark:text-slate-400">
              សូមបញ្ចូលពាក្យសម្ងាត់ដើម្បីបើកសិទ្ធិ Super Guest (Unlock All Lessons)
            </p>
          </div>

          {passwordError && (
            <Alert
              message={passwordError}
              type="error"
              showIcon
              className="text-left text-xs font-semibold rounded-xl"
            />
          )}

          <form onSubmit={handleVerifySuperGuestPassword} className="space-y-4 pt-2">
            <div className="text-left space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Super Guest Password
              </label>
              <Input.Password
                size="large"
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                className="rounded-xl font-mono text-sm"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="large"
                onClick={() => {
                  setModalOpen(false);
                  setPasswordInput("");
                  setPasswordError("");
                }}
                className="rounded-xl font-bold"
              >
                បោះបង់ (Cancel)
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={verifying}
                icon={<LuLockKeyholeOpen size={16} />}
                className="rounded-xl font-bold bg-amber-500 hover:!bg-amber-600 border-none"
              >
                ដោះសោទាំងអស់ (Unlock)
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
