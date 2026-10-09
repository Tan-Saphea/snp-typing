import { useEffect, useMemo, useRef, useState } from "react";
import { alignGraphemes, normalizeForComparison, segmentGraphemes } from "@snp/shared";
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Progress,
  Radio,
  Result,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  LuAlignCenter,
  LuAlignLeft,
  LuAlignRight,
  LuArrowLeft,
  LuBold,
  LuCaseUpper,
  LuCheck,
  LuCircleCheck,
  LuClipboardPaste,
  LuCopy,
  LuFileText,
  LuHighlighter,
  LuImage,
  LuInfo,
  LuItalic,
  LuKeyboard,
  LuList,
  LuListOrdered,
  LuPalette,
  LuRedo2,
  LuRotateCcw,
  LuScissors,
  LuShapes,
  LuSparkles,
  LuTextCursorInput,
  LuTrophy,
  LuUnderline,
  LuUndo2,
} from "react-icons/lu";

import { PageError, PageLoader } from "../components/AsyncState.jsx";
import { Link, useParams } from "../components/NextRouter.jsx";
import Stars from "../components/Stars.jsx";
import { playKeyboardSound } from "../features/typing/keyboardSound.js";
import { buildTargetText } from "../features/typing/typingContent.js";
import { getApiErrorMessage } from "../services/api.js";
import { getLesson } from "../services/lessonService.js";
import { saveLessonResult } from "../services/resultService.js";

const { Title, Text } = Typography;

const skillGuides = {
  Copy: {
    shortcut: "Ctrl + C",
    titleKm: "ការចម្លង (Copy)",
    desc: "Copies selected text to the clipboard so you can paste it anywhere.",
    descKm: "ចម្លងអត្ថបទដែលបានជ្រើសរើសទៅកាន់ Clipboard ដើម្បីយកទៅបិទភ្ជាប់។",
  },
  Paste: {
    shortcut: "Ctrl + V",
    titleKm: "ការបិទភ្ជាប់ (Paste)",
    desc: "Pastes copied text from the clipboard into your document.",
    descKm: "បិទភ្ជាប់អត្ថបទដែលបានចម្លងរួចចូលទៅក្នុងឯកសារ។",
  },
  Cut: {
    shortcut: "Ctrl + X",
    titleKm: "ការកាត់ (Cut)",
    desc: "Cuts the text from the document and saves it to clipboard.",
    descKm: "កាត់អត្ថបទចេញពីឯកសារ និងរក្សាទុកក្នុង Clipboard។",
  },
  Undo: {
    shortcut: "Ctrl + Z",
    titleKm: "ត្រឡប់ក្រោយ (Undo)",
    desc: "Reverses your last formatting or typing action.",
    descKm: "ត្រឡប់ក្រោយវិញនូវសកម្មភាពមុននេះ។",
  },
  Redo: {
    shortcut: "Ctrl + Y",
    titleKm: "ធ្វើឡើងវិញ (Redo)",
    desc: "Re-applies the action you just undid.",
    descKm: "ធ្វើសកម្មភាពដែលបាន Undo ឡើងវិញ។",
  },
  Bold: {
    shortcut: "Ctrl + B",
    titleKm: "អក្សរដិត (Bold)",
    desc: "Makes text bold and prominent for titles and emphasis.",
    descKm: "ធ្វើឱ្យអក្សរដិត និងច្បាស់សម្រាប់ចំណងជើង ឬចំណុចសំខាន់។",
  },
  Italic: {
    shortcut: "Ctrl + I",
    titleKm: "អក្សរទ្រេត (Italic)",
    desc: "Slants text to the right for quotes and terms.",
    descKm: "ធ្វើឱ្យអក្សរទ្រេតទៅស្ដាំសម្រាប់សម្រង់សម្តី ឬពាក្យបច្ចេកទេស។",
  },
  Underline: {
    shortcut: "Ctrl + U",
    titleKm: "គូសបន្ទាត់ក្រោម (Underline)",
    desc: "Draws a line directly under text.",
    descKm: "គូសបន្ទាត់ពីក្រោមអត្ថបទដើម្បីទាក់ទាញចំណាប់អារម្មណ៍។",
  },
  Font: {
    shortcut: "Font Family",
    titleKm: "ពុម្ពអក្សរ (Font Style)",
    desc: "Changes font typeface between Sans-Serif and Serif.",
    descKm: "ផ្លាស់ប្តូរទម្រង់ពុម្ពអក្សរឱ្យសមរម្យតាមប្រភេទឯកសារ។",
  },
  "Font Size": {
    shortcut: "Ctrl + ] / [",
    titleKm: "ទំហំអក្សរ (Font Size)",
    desc: "Increases or decreases the size of letters.",
    descKm: "បង្កើន ឬបន្ថយទំហំតួអក្សរឱ្យធំ ឬតូច។",
  },
  "Font Color": {
    shortcut: "Color Picker",
    titleKm: "ពណ៌អក្សរ (Font Color)",
    desc: "Changes text color to enhance readability and design.",
    descKm: "ផ្លាស់ប្តូរពណ៌តួអក្សរដើម្បីឱ្យឯកសារមានភាពស្រស់ស្អាត។",
  },
  Highlight: {
    shortcut: "Text Marker",
    titleKm: "ពណ៌បន្លិច (Text Highlight)",
    desc: "Adds background color behind text like a highlighter marker.",
    descKm: "បន្ថែមពណ៌ផ្ទៃខាងក្រោយអក្សរដូចប៊ិចហ្វឺតបន្លិច។",
  },
  Alignment: {
    shortcut: "Ctrl + L / E / R",
    titleKm: "តម្រឹមកថាខណ្ឌ (Text Alignment)",
    desc: "Aligns text to the Left, Center, or Right of the page.",
    descKm: "តម្រឹមអត្ថបទទៅខាងឆ្វេង កណ្តាល ឬខាងស្ដាំនៃទំព័រ។",
  },
  Bullets: {
    shortcut: "Bullet List",
    titleKm: "ចំណុចមូល (Bullet List)",
    desc: "Formats list items with clear bullet point dots.",
    descKm: "រៀបចំបញ្ជីទិន្នន័យដោយប្រើសញ្ញាចំណុចមូល។",
  },
  Numbering: {
    shortcut: "Numbered List",
    titleKm: "លេខរៀង (Numbered List)",
    desc: "Formats sequential steps or items with 1, 2, 3 numbers.",
    descKm: "រៀបចំលំដាប់លំដោយ ឬជំហាននីមួយៗដោយលេខរៀង ១, ២, ៣។",
  },
  Pictures: {
    shortcut: "Insert Picture",
    titleKm: "បញ្ចូលរូបភាព (Insert Picture)",
    desc: "Inserts an illustration or photo into the document.",
    descKm: "បញ្ចូលរូបភាពដើម្បីបន្ថែមអត្ថន័យដល់ឯកសារ។",
  },
  Shapes: {
    shortcut: "Insert Shapes",
    titleKm: "បញ្ចូលរាង (Insert Shapes)",
    desc: "Inserts geometric shapes and symbols into the document.",
    descKm: "បញ្ចូលរាងធរណីមាត្រ ឬនិមិត្តសញ្ញាផ្សេងៗ។",
  },
};

export default function ComputerSkillWorkspacePage() {
  const { lessonId } = useParams();
  const [state, setState] = useState({ loading: true, lesson: null, error: "" });
  const [text, setText] = useState("");
  const [clipboard, setClipboard] = useState("");
  const [history, setHistory] = useState([]);
  const [redo, setRedo] = useState([]);
  const [applied, setApplied] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const [format, setFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    size: 16,
    color: "#1e293b",
    highlight: "transparent",
    align: "left",
    font: '"Google Sans", sans-serif',
  });
  const [result, setResult] = useState(null);
  const startedAt = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    getLesson(lessonId)
      .then(({ lesson }) => {
        setState({ loading: false, lesson, error: "" });
        setText("");
        setApplied([]);
        setHistory([]);
        setRedo([]);
      })
      .catch((error) =>
        setState({ loading: false, lesson: null, error: getApiErrorMessage(error) })
      );
  }, [lessonId]);

  const targetText = useMemo(
    () => (state.lesson ? buildTargetText(state.lesson) : ""),
    [state.lesson]
  );

  const requirements = useMemo(
    () => state.lesson?.content.blocks.flatMap((block) => block.items ?? []) ?? [],
    [state.lesson]
  );

  const primarySkill = requirements[0] || state.lesson?.title || "Bold";
  const guideInfo = skillGuides[primarySkill] || {
    shortcut: "Skill Tool",
    titleKm: state.lesson?.title || "ជំនាញកុំព្យូទ័រ",
    desc: state.lesson?.instructions || "Use the toolbar to format your document.",
    descKm: "ប្រើប្រាស់ឧបករណ៍នៅលើ Toolbar ដើម្បីកំណត់ទម្រង់ឯកសារ។",
  };

  if (state.loading) return <PageLoader message="Opening Computer Skills Lab…" />;
  if (state.error) return <PageError message={state.error} />;

  function remember() {
    setHistory((value) => [...value.slice(-19), { text, format }]);
    setRedo([]);
  }

  function insertSampleText() {
    startedAt.current ??= Date.now();
    remember();
    setText(targetText);
    textareaRef.current?.focus();
  }

  function apply(tool) {
    startedAt.current ??= Date.now();
    if (tool === "Undo") {
      const previous = history.at(-1);
      if (previous) {
        setRedo((value) => [...value, { text, format }]);
        setText(previous.text);
        setFormat(previous.format);
        setHistory((value) => value.slice(0, -1));
      }
    } else if (tool === "Redo") {
      const next = redo.at(-1);
      if (next) {
        setHistory((value) => [...value, { text, format }]);
        setText(next.text);
        setFormat(next.format);
        setRedo((value) => value.slice(0, -1));
      }
    } else {
      remember();
      if (tool === "Copy") {
        setClipboard(text || targetText);
      }
      if (tool === "Paste") {
        setText((value) => (clipboard ? `${value}\n${clipboard}`.trim() : `${value}\n${targetText}`.trim()));
      }
      if (tool === "Cut") {
        setClipboard(text);
        setText("");
      }
      if (tool === "Font") {
        setFormat((value) => ({ ...value, font: value.font === "serif" ? "sans-serif" : "serif" }));
      }
      if (tool === "Font Size") {
        setFormat((value) => ({ ...value, size: value.size >= 22 ? 16 : value.size + 4 }));
      }
      if (tool === "Bold") setFormat((value) => ({ ...value, bold: !value.bold }));
      if (tool === "Italic") setFormat((value) => ({ ...value, italic: !value.italic }));
      if (tool === "Underline") setFormat((value) => ({ ...value, underline: !value.underline }));
      if (tool === "Font Color") {
        setFormat((value) => ({
          ...value,
          color: value.color === "#2563eb" ? "#1e293b" : "#2563eb",
        }));
      }
      if (tool === "Highlight") {
        setFormat((value) => ({
          ...value,
          highlight: value.highlight === "#fef08a" ? "transparent" : "#fef08a",
        }));
      }
      if (tool === "Alignment") {
        setFormat((value) => ({
          ...value,
          align: value.align === "left" ? "center" : value.align === "center" ? "right" : "left",
        }));
      }
      if (tool === "Bullets") {
        setText((value) =>
          (value || targetText)
            .split("\n")
            .map((line) => (line.startsWith("• ") ? line : `• ${line}`))
            .join("\n")
        );
      }
      if (tool === "Numbering") {
        setText((value) =>
          (value || targetText)
            .split("\n")
            .map((line, index) => (/^\d+\.\s/.test(line) ? line : `${index + 1}. ${line}`))
            .join("\n")
        );
      }
      if (tool === "Pictures") {
        setText((value) => `${value || targetText}\n🖼️ [Inserted Picture: School Campus]`);
      }
      if (tool === "Shapes") {
        setText((value) => `${value || targetText}\n◆ ★ ▲ [Inserted Geometry Shapes]`);
      }
    }
    setApplied((value) => (value.includes(tool) ? value : [...value, tool]));
    textareaRef.current?.focus();
  }

  async function complete() {
    const comparableText = text
      .replace(/^(?:• |\d+\. )/gmu, "")
      .replace(/\n\[Inserted.*?\]/gu, "")
      .trim();
    const alignment = alignGraphemes(targetText, comparableText, state.lesson.language);
    const targetUnits = alignment.targetSegments;
    const typedUnits = alignment.inputSegments;
    const correct = alignment.correct;
    const errors = alignment.incorrect;
    const start = startedAt.current ?? Date.now();
    const duration = Math.max((Date.now() - start) / 1000, 0.1);

    const completedRequirements = requirements.filter((item) => applied.includes(item));
    const formattingScore = requirements.length
      ? Math.round((completedRequirements.length / requirements.length) * 30)
      : 30;

    try {
      const saved = await saveLessonResult({
        lessonId: state.lesson.id,
        startedAt: new Date(start).toISOString(),
        duration,
        totalTyped: Math.max(typedUnits.length, 1),
        totalCharacters: targetUnits.length,
        correctCharacters: correct,
        incorrectCharacters: errors,
        totalGraphemes: targetUnits.length,
        correctGraphemes: correct,
        incorrectGraphemes: errors,
        errors,
        mode: "lesson",
      });

      setResult({
        ...saved.result,
        duration,
        formatting: formattingScore,
      });
    } catch (error) {
      setState((current) => ({ ...current, error: getApiErrorMessage(error) }));
    }
  }

  const allRequirementsCompleted =
    requirements.length > 0 &&
    requirements.every((req) => applied.includes(req));

  if (result) {
    const totalScore = Math.min(
      100,
      Math.min(40, Math.round(result.accuracy * 0.4)) +
        Math.min(20, Math.round(result.accuracy * 0.2)) +
        result.formatting +
        10
    );

    return (
      <div className="mx-auto max-w-2xl py-6">
        <Card
          variant="outlined"
          className="rounded-3xl shadow-xl text-center p-6 sm:p-10 dark:border-slate-800"
        >
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-500/10 text-4xl text-[#52c41a] mb-4">
            <LuTrophy size={36} />
          </div>

          <Tag color="success" className="font-bold uppercase tracking-wider rounded-md">
            Simulation Completed
          </Tag>
          <h2 className="m-0 mt-3 text-3xl font-black text-slate-900 dark:text-white">
            Skill Mastered!
          </h2>
          <p className="m-0 mt-2 text-sm text-slate-500 max-w-md mx-auto">
            {state.lesson.title} simulation completed and saved to your learner profile.
          </p>

          <div className="my-6 flex justify-center">
            <Stars count={result.stars ?? 3} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 text-left">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/60">
              <p className="m-0 text-xs font-bold text-slate-400 uppercase">Typing Text</p>
              <p className="m-0 text-2xl font-black text-[#52c41a]">
                {Math.min(40, Math.round(result.accuracy * 0.4))}/40
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/60">
              <p className="m-0 text-xs font-bold text-slate-400 uppercase">Formatting</p>
              <p className="m-0 text-2xl font-black text-sky-500">{result.formatting}/30</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/60">
              <p className="m-0 text-xs font-bold text-slate-400 uppercase">Accuracy</p>
              <p className="m-0 text-2xl font-black text-amber-500">{Math.round(result.accuracy)}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/60">
              <p className="m-0 text-xs font-bold text-slate-400 uppercase">Total Score</p>
              <p className="m-0 text-2xl font-black text-slate-900 dark:text-white">{totalScore}/100</p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Link to="/computer-skills">
              <Button type="primary" size="large" className="font-bold px-8 h-12 rounded-xl text-base">
                Back to Computer Skills Lab
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link
          to="/computer-skills"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <LuArrowLeft size={16} />
          <span>Back to Skills Lab</span>
        </Link>
        <span className="text-xs font-bold text-[#52c41a]">
          Level {state.lesson.level} · Simulation Active
        </span>
      </div>

      {/* Interactive Tutorial Guide Box */}
      <Card
        variant="outlined"
        className="rounded-3xl bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-slate-900/10 border-emerald-500/30 shadow-lg"
        styles={{ body: { padding: "20px sm:24px" } }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 shrink-0 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[#52c41a] text-2xl shadow-sm">
              <LuSparkles />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="m-0 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {state.lesson.title} ({guideInfo.titleKm})
                </h1>
                {guideInfo.shortcut && (
                  <Tag color="success" className="font-mono font-bold text-xs">
                    {guideInfo.shortcut}
                  </Tag>
                )}
              </div>
              <p className="m-0 mt-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                {guideInfo.descKm} ({guideInfo.desc})
              </p>
            </div>
          </div>

          {/* Quick Helper Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="default"
              icon={<LuFileText size={15} />}
              onClick={insertSampleText}
              className="font-bold text-xs h-10 px-4 rounded-xl border-emerald-500/40 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800"
            >
              📄 Insert Practice Text
            </Button>
          </div>
        </div>
      </Card>

      {/* Realistic Microsoft Word Ribbon Simulator */}
      <Card
        variant="outlined"
        className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        {/* Ribbon Tab Switcher */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <Button
              type={activeTab === "home" ? "primary" : "text"}
              size="small"
              onClick={() => setActiveTab("home")}
              className="font-bold text-xs rounded-lg"
            >
              Home (ទំព័រដើម)
            </Button>
            <Button
              type={activeTab === "insert" ? "primary" : "text"}
              size="small"
              onClick={() => setActiveTab("insert")}
              className="font-bold text-xs rounded-lg"
            >
              Insert (បញ្ចូល)
            </Button>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Microsoft Word Simulator
          </span>
        </div>

        {/* Home Ribbon Tools */}
        {activeTab === "home" && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center gap-3">
            {/* Clipboard Section */}
            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3">
              <Tooltip title="Paste (Ctrl + V)">
                <Button
                  onClick={() => apply("Paste")}
                  icon={<LuClipboardPaste size={15} />}
                  className={`h-9 font-bold text-xs flex items-center gap-1 rounded-lg ${
                    applied.includes("Paste") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                >
                  Paste
                </Button>
              </Tooltip>
              <Tooltip title="Copy (Ctrl + C)">
                <Button
                  onClick={() => apply("Copy")}
                  icon={<LuCopy size={15} />}
                  className={`h-9 px-2.5 rounded-lg ${
                    applied.includes("Copy") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                />
              </Tooltip>
              <Tooltip title="Cut (Ctrl + X)">
                <Button
                  onClick={() => apply("Cut")}
                  icon={<LuScissors size={15} />}
                  className={`h-9 px-2.5 rounded-lg ${
                    applied.includes("Cut") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                />
              </Tooltip>
            </div>

            {/* Font Styling Section */}
            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3">
              <Tooltip title="Toggle Font Style (Sans / Serif)">
                <Button
                  onClick={() => apply("Font")}
                  icon={<LuCaseUpper size={15} />}
                  className={`h-9 font-bold text-xs rounded-lg ${
                    applied.includes("Font") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                >
                  {format.font === "serif" ? "Serif" : "Sans"}
                </Button>
              </Tooltip>

              <Tooltip title="Font Size">
                <Button
                  onClick={() => apply("Font Size")}
                  icon={<LuTextCursorInput size={15} />}
                  className={`h-9 font-bold text-xs rounded-lg ${
                    applied.includes("Font Size") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                >
                  {format.size}px
                </Button>
              </Tooltip>

              <Tooltip title="Bold (Ctrl + B)">
                <Button
                  onClick={() => apply("Bold")}
                  icon={<LuBold size={15} />}
                  type={format.bold ? "primary" : "default"}
                  className="h-9 px-3 rounded-lg font-black"
                />
              </Tooltip>

              <Tooltip title="Italic (Ctrl + I)">
                <Button
                  onClick={() => apply("Italic")}
                  icon={<LuItalic size={15} />}
                  type={format.italic ? "primary" : "default"}
                  className="h-9 px-3 rounded-lg font-bold"
                />
              </Tooltip>

              <Tooltip title="Underline (Ctrl + U)">
                <Button
                  onClick={() => apply("Underline")}
                  icon={<LuUnderline size={15} />}
                  type={format.underline ? "primary" : "default"}
                  className="h-9 px-3 rounded-lg font-bold"
                />
              </Tooltip>

              <Tooltip title="Font Color">
                <Button
                  onClick={() => apply("Font Color")}
                  icon={<LuPalette size={15} className={format.color === "#2563eb" ? "text-blue-500" : ""} />}
                  className={`h-9 px-2.5 rounded-lg ${
                    applied.includes("Font Color") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                />
              </Tooltip>

              <Tooltip title="Highlight Color">
                <Button
                  onClick={() => apply("Highlight")}
                  icon={<LuHighlighter size={15} className={format.highlight !== "transparent" ? "text-amber-500" : ""} />}
                  className={`h-9 px-2.5 rounded-lg ${
                    applied.includes("Highlight") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                />
              </Tooltip>
            </div>

            {/* Paragraph Alignment & Lists Section */}
            <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3">
              <Tooltip title="Text Alignment">
                <Button
                  onClick={() => apply("Alignment")}
                  icon={format.align === "center" ? <LuAlignCenter size={15} /> : format.align === "right" ? <LuAlignRight size={15} /> : <LuAlignLeft size={15} />}
                  className={`h-9 font-bold text-xs flex items-center gap-1 rounded-lg ${
                    applied.includes("Alignment") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                >
                  <span className="capitalize">{format.align}</span>
                </Button>
              </Tooltip>

              <Tooltip title="Bullet Points">
                <Button
                  onClick={() => apply("Bullets")}
                  icon={<LuList size={15} />}
                  className={`h-9 px-2.5 rounded-lg ${
                    applied.includes("Bullets") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                />
              </Tooltip>

              <Tooltip title="Numbered List">
                <Button
                  onClick={() => apply("Numbering")}
                  icon={<LuListOrdered size={15} />}
                  className={`h-9 px-2.5 rounded-lg ${
                    applied.includes("Numbering") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                />
              </Tooltip>
            </div>

            {/* Undo & Redo History */}
            <div className="flex items-center gap-1">
              <Tooltip title="Undo (Ctrl + Z)">
                <Button
                  onClick={() => apply("Undo")}
                  icon={<LuUndo2 size={15} />}
                  className={`h-9 px-2.5 rounded-lg ${
                    applied.includes("Undo") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                />
              </Tooltip>
              <Tooltip title="Redo (Ctrl + Y)">
                <Button
                  onClick={() => apply("Redo")}
                  icon={<LuRedo2 size={15} />}
                  className={`h-9 px-2.5 rounded-lg ${
                    applied.includes("Redo") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
                  }`}
                />
              </Tooltip>
            </div>
          </div>
        )}

        {/* Insert Ribbon Tools */}
        {activeTab === "insert" && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => apply("Pictures")}
              icon={<LuImage size={16} />}
              className={`h-9 font-bold text-xs flex items-center gap-1.5 rounded-lg ${
                applied.includes("Pictures") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
              }`}
            >
              Insert Picture (🖼️)
            </Button>
            <Button
              onClick={() => apply("Shapes")}
              icon={<LuShapes size={16} />}
              className={`h-9 font-bold text-xs flex items-center gap-1.5 rounded-lg ${
                applied.includes("Shapes") ? "bg-emerald-500/15 border-emerald-500 text-[#52c41a]" : ""
              }`}
            >
              Insert Shapes (◆ ★ ▲)
            </Button>
          </div>
        )}

        {/* Live A4 Document Sheet Editor */}
        <div className="p-6 sm:p-8 bg-slate-200/60 dark:bg-slate-950 flex justify-center">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-800 p-8 sm:p-12 min-h-[380px] flex flex-col">
            {/* Document Header Page Line */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Document 1 - Word Processing Sheet
              </span>
              <span className="text-[10px] font-bold text-slate-400">Page 1 of 1</span>
            </div>

            {/* Editable Text Surface */}
            <textarea
              ref={textareaRef}
              className="flex-1 w-full resize-none bg-transparent outline-none transition leading-relaxed min-h-[260px] p-2"
              onChange={(event) => {
                startedAt.current ??= Date.now();
                remember();
                setText(event.target.value);
              }}
              onKeyDown={(e) => {
                if (!e.repeat && !["Dead", "Process", "Unidentified"].includes(e.key)) {
                  playKeyboardSound({ key: e.key, code: e.code });
                }
              }}
              style={{
                fontFamily: format.font,
                fontSize: `${format.size}px`,
                fontWeight: format.bold ? 800 : 400,
                fontStyle: format.italic ? "italic" : "normal",
                textDecoration: format.underline ? "underline" : "none",
                color: format.color,
                backgroundColor: format.highlight,
                textAlign: format.align,
              }}
              value={text}
              placeholder="Type your document here or click 'Insert Practice Text' above to start formatting…"
            />
          </div>
        </div>

        {/* Task Checklist & Submit Bar */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <LuCheck className="text-[#52c41a]" size={16} />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Skills Required for This Lesson:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {requirements.map((item) => {
                const isDone = applied.includes(item);
                return (
                  <Tag
                    key={item}
                    color={isDone ? "success" : "default"}
                    className="rounded-xl px-3 py-1 font-bold text-xs flex items-center gap-1.5 m-0"
                  >
                    {isDone ? <LuCircleCheck className="text-[#52c41a]" /> : "○"}
                    <span>{item}</span>
                  </Tag>
                );
              })}
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            disabled={!text.trim()}
            onClick={complete}
            className="font-bold px-8 h-12 rounded-xl text-base shrink-0 shadow-lg shadow-emerald-500/20"
          >
            {allRequirementsCompleted ? "✓ Complete Task & Save" : "Complete Task & Save"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
