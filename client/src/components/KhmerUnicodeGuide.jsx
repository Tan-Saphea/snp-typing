import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Radio,
  Space,
  Tag,
  Tooltip,
} from "antd";
import {
  LuBookOpen,
  LuCheck,
  LuCircleAlert,
  LuCircleCheck,
  LuCopy,
  LuInfo,
  LuKeyboard,
  LuLayers,
  LuSearch,
  LuSparkles,
  LuType,
  LuX,
  LuZap,
} from "react-icons/lu";

// Sample words for practice tester
const KHMER_PRACTICE_WORDS = [
  {
    word: "កម្ពុជា",
    phonetic: "Kampuchea",
    meaning: "Cambodia",
    keystrokes: [
      { char: "ក", key: "k", note: "ព្យញ្ជនៈដើម" },
      { char: "្", key: "Shift + J", note: "សញ្ញាជើង (Coeng)" },
      { char: "ព", key: "b", note: "ជើងព" },
      { char: "ុ", key: "u", note: "ស្រៈ ុ" },
      { char: "ជ", key: "c", note: "ព្យញ្ជនៈ ជ" },
      { char: "ា", key: "a", note: "ស្រៈ ា" },
    ],
    difficulty: "មូលដ្ឋាន (Basic)",
  },
  {
    word: "សង្គ្រាម",
    phonetic: "Songkream",
    meaning: "War",
    keystrokes: [
      { char: "ស", key: "s", note: "ព្យញ្ជនៈ ស" },
      { char: "ង", key: "g", note: "ព្យញ្ជនៈ ង" },
      { char: "្", key: "Shift + J", note: "សញ្ញាជើងទី១" },
      { char: "គ", key: "Shift + K", note: "ជើងគ" },
      { char: "្", key: "Shift + J", note: "សញ្ញាជើងទី២" },
      { char: "រ", key: "r", note: "ជើងរ (្រ)" },
      { char: "ា", key: "a", note: "ស្រៈ ា" },
      { char: "ម", key: "m", note: "ព្យញ្ជនៈ ម" },
    ],
    difficulty: "ជើងពីរជាន់ (Double Subscript)",
  },
  {
    word: "រដ្ឋបាល",
    phonetic: "Rotthabal",
    meaning: "Administration",
    keystrokes: [
      { char: "រ", key: "r", note: "ព្យញ្ជនៈ រ" },
      { char: "ដ", key: "Shift + D", note: "ព្យញ្ជនៈ ដ" },
      { char: "្", key: "Shift + J", note: "សញ្ញាជើង" },
      { char: "ឋ", key: "Shift + Z", note: "ជើងឋ" },
      { char: "ប", key: "p", note: "ព្យញ្ជនៈ ប" },
      { char: "ា", key: "a", note: "ស្រៈ ា" },
      { char: "ល", key: "l", note: "ព្យញ្ជនៈ ល" },
    ],
    difficulty: "ជើងអក្សរពិសេស (Special Subscript)",
  },
  {
    word: "កិត្តិយស",
    phonetic: "Kitteyos",
    meaning: "Honor / Dignity",
    keystrokes: [
      { char: "ក", key: "k", note: "ព្យញ្ជនៈ ក" },
      { char: "ិ", key: "i", note: "ស្រៈ ិ" },
      { char: "ត", key: "t", note: "ព្យញ្ជនៈ ត" },
      { char: "្", key: "Shift + J", note: "សញ្ញាជើង" },
      { char: "ត", key: "t", note: "ជើងត" },
      { char: "ិ", key: "i", note: "ស្រៈ ិ" },
      { char: "យ", key: "y", note: "ព្យញ្ជនៈ យ" },
      { char: "ស", key: "s", note: "ព្យញ្ជនៈ ស" },
    ],
    difficulty: "ជើងត្រួត & ស្រៈ (Layered)",
  },
  {
    word: "ប្រវត្តិសាស្ត្រ",
    phonetic: "Pravattisastra",
    meaning: "History",
    keystrokes: [
      { char: "ប", key: "p", note: "ព្យញ្ជនៈ ប" },
      { char: "្", key: "Shift + J", note: "សញ្ញាជើង" },
      { char: "រ", key: "r", note: "ជើងរ (្រ)" },
      { char: "វ", key: "v", note: "ព្យញ្ជនៈ វ" },
      { char: "ត", key: "t", note: "ព្យញ្ជនៈ ត" },
      { char: "្", key: "Shift + J", note: "សញ្ញាជើង" },
      { char: "ត", key: "t", note: "ជើងត" },
      { char: "ិ", key: "i", note: "ស្រៈ ិ" },
      { char: "ស", key: "s", note: "ព្យញ្ជនៈ ស" },
      { char: "ា", key: "a", note: "ស្រៈ ា" },
      { char: "ស", key: "s", note: "ព្យញ្ជនៈ ស" },
      { char: "្", key: "Shift + J", note: "សញ្ញាជើងទី១" },
      { char: "ត", key: "t", note: "ជើងត" },
      { char: "្", key: "Shift + J", note: "សញ្ញាជើងទី២" },
      { char: "រ", key: "r", note: "ជើងរ" },
    ],
    difficulty: "ពាក្យកម្រិតខ្ពស់ (Advanced Word)",
  },
];

// Independent Vowels List
const INDEPENDENT_VOWELS = [
  { char: "ឦ", name: "ស្រៈ ឦ", key: "Shift + I", example: "ឦសាន (Isan)" },
  { char: "ឧ", name: "ស្រៈ ឧ", key: "Shift + U", example: "ឧត្តម, ឧស្សាហ៍" },
  { char: "ឩ", name: "ស្រៈ ឩ", key: "Shift + Y", example: "ឩបករណូបករណ៍" },
  { char: "ឪ", name: "ស្រៈ ឪ", key: "Shift + W", example: "ឪពុក (Father)" },
  { char: "ឫ", name: "ស្រៈ ឫ", key: "Shift + R", example: "ឫស្សី, ឫសគល់" },
  { char: "ឬ", name: "ស្រៈ ឬ", key: "Shift + T", example: "ឬស្សី, ឬក៏ (Or)" },
  { char: "ឭ", name: "ស្រៈ ឭ", key: "Shift + E", example: "ឮឭ" },
  { char: "ឮ", name: "ស្រៈ ឮ", key: "Shift + Q", example: "ឮសូរ, ឮដំណឹង" },
  { char: "ឯ", name: "ស្រៈ ឯ", key: "Shift + P", example: "ឯករាជ្យ, ឯកសារ" },
  { char: "ឰ", name: "ស្រៈ ឰ", key: "Shift + S", example: "ឰដ៏ (Aika)" },
  { char: "ឱ", name: "ស្រៈ ឱ", key: "Shift + O", example: "ឱកាស, ឱសថ" },
  { char: "ឳ", name: "ស្រៈ ឳ", key: "Shift + V", example: "ឳភាស" },
];

// Khmer Diacritics and Signs
const DIACRITICS_AND_PUNCTUATION = [
  { char: " ៍", name: "ទណ្ឌឃាត (Tondakheatt)", key: "Shift + 6", use: "សម្រាប់សម្លាប់សំឡេងអក្សរ ដូចជា៖ ទូរទស្សន៍, វេជ្ជបណ្ឌិត" },
  { char: " ៏", name: "អស្តា / កាកបាទ (Asda)", key: "Shift + 7", use: "បន្លឺសំឡេងខ្លី ដូចជា៖ ដ៏, ក៏, ណ៏" },
  { char: " ័", name: "សំយោគសញ្ញា (Somyok)", key: "Shift + 8", use: "ជំនួសស្រៈ ដូចជា៖ ជ័យ, វ័យ, ស័ក្តិ" },
  { char: " ៗ", name: "លេកទោ / រេខាខណ្ឌ (Lekto)", key: "Shift + 2", use: "សម្រាប់ផ្ទួនពាក្យ ដូចជា៖ ផ្សេងៗ, ញឹកញាប់ៗ" },
  { char: " ។", name: "ខណ្ឌ (Khand)", key: "Shift + . (Period)", use: "បញ្ចប់ឃ្លា ឬបញ្ចប់ប្រយោគធម្មតា" },
  { char: " ៕", name: "បរិយោសាន (Bariyosan)", key: "Shift + / (Slash)", use: "បញ្ចប់រឿង ឬបញ្ចប់អត្ថបទទាំងស្រុង" },
  { char: " ៖", name: "យុគលពិន្ទុ (Yokolpinto)", key: "Shift + ; (Semicolon)", use: "ចុះបន្ទាត់រាយឈ្មោះ ឬពន្យល់ ដូចជា៖" },
  { char: " ៘", name: "បេយ្យាលៈ / លាក់ (Peyyala)", key: "Shift + \\ (Backslash)", use: "មានន័យថា «និងអ្វីៗផ្សេងទៀត» (Etc.)" },
  { char: "ZWSP", name: "កាត់ពាក្យ (Zero-Width Space)", key: "Shift + Space", use: "កាត់ពាក្យខ្មែរឱ្យត្រឹមត្រូវដោយមិនបែកចន្លោះធំ" },
];

// Common Traps & Fixes
const COMMON_MISTAKES = [
  {
    wrong: "េ + ា",
    correct: "ោ",
    key: "ចុចគ្រាប់ចុច [",
    description: "កុំវាយស្រៈ េ រួច ា ចូលគ្នាដើម្បីបាន ោ ឡើយ ព្រោះធ្វើឱ្យខុសយូនីកូដ និង Search រកមិនឃើញ។",
  },
  {
    wrong: "េ + ី",
    correct: "ើ",
    key: "ចុចគ្រាប់ចុច ]",
    description: "ត្រូវចុចគ្រាប់ចុច ើ តែម្ដង មិនត្រូវវាយស្រៈ េ បូក ី នោះទេ។",
  },
  {
    wrong: "េ + ៅ",
    correct: "ៅ",
    key: "ចុចគ្រាប់ចុច O (អក្សរ O)",
    description: "ស្រៈ ៅ មានគ្រាប់ចុចដាច់ដោយឡែក មិនត្រូវផ្សំពី េ ឡើយ។",
  },
  {
    wrong: "ិ + ី",
    correct: "ី",
    key: "ចុចគ្រាប់ចុច U",
    description: "កុំវាយស្រៈ ិ មុនទើបចុច ី ព្រោះធ្វើឱ្យត្រួតស្រៈពីរជាន់ខុសក្បួន។",
  },
  {
    wrong: "ស្រៈ មុន ព្យញ្ជនៈ (ឧ. េ + ត)",
    correct: "ត + េ = តេ",
    key: "ព្យញ្ជនៈ មុនជានិច្ច",
    description: "ទោះបីជាស្រៈ េ, ែ, ៃ, ោ, ៅ នៅខាងមុខក៏ដោយ ត្រូវតែវាយព្យញ្ជនៈមុនសិនជានិច្ច!",
  },
];

export default function KhmerUnicodeGuide() {
  const [selectedWord, setSelectedWord] = useState(KHMER_PRACTICE_WORDS[0]);
  const [testInput, setTestInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const isMatched = testInput.trim() === selectedWord.word;

  return (
    <div className="space-y-8 select-none">
      {/* 1. TOP NOTICE: FUNDAMENTAL UNICODE PRINCIPLE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border-2 border-emerald-500/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 font-black text-xs uppercase tracking-wider">
            <LuSparkles className="animate-spin" />
            <span>ក្បួនមាសយូនីកូដខ្មែរ (The Golden Rule of Khmer Unicode)</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white m-0 leading-tight">
            លំដាប់លំដោយនៃការវាយអក្សរខ្មែរត្រឹមត្រូវ ១០០%
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="text-[10px] font-extrabold text-emerald-400 uppercase">ជំហានទី ១ (Step 1)</div>
              <div className="text-base font-black text-white mt-1">ព្យញ្ជនៈដើម</div>
              <div className="text-xs text-slate-300">Base Consonant (ក-អ)</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="text-[10px] font-extrabold text-amber-400 uppercase">ជំហានទី ២ (Step 2)</div>
              <div className="text-base font-black text-white mt-1">សញ្ញាជើង + ជើង</div>
              <div className="text-xs text-slate-300">Shift + J រួចចុចព្យញ្ជនៈ</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="text-[10px] font-extrabold text-sky-400 uppercase">ជំហានទី ៣ (Step 3)</div>
              <div className="text-base font-black text-white mt-1">ស្រៈនិស្ស័យ</div>
              <div className="text-xs text-slate-300">Vowels (ា, ិ, ី, ឹ, ឺ, ុ, ូ, េ, ...)</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="text-[10px] font-extrabold text-purple-400 uppercase">ជំហានទី ៤ (Step 4)</div>
              <div className="text-base font-black text-white mt-1">វណ្ណយុត្តិ / សញ្ញា</div>
              <div className="text-xs text-slate-300">Signs ( ៍, ៏, ័, ៗ, ំ, ះ)</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs sm:text-sm font-medium flex items-center gap-2">
            <LuCircleAlert className="text-amber-400 flex-shrink-0 text-lg" />
            <span>
              <strong>ចំណាំសំខាន់បំផុត៖</strong> ទោះបីជាស្រៈខ្លះស្ថិតនៅខាងមុខព្យញ្ជនៈ (ដូចជា <strong>េ, ែ, ៃ, ោ, ៅ</strong>) ក៏ដោយ ក៏ត្រូវតែ<strong>វាយព្យញ្ជនៈមុនសិនជានិច្ច</strong> រួចទើបវាយស្រៈជាក្រោយ!
            </span>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE LIVE KEYSTROKE BREAKDOWN TESTER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white m-0 flex items-center gap-2">
              <LuKeyboard className="text-[#52c41a]" />
              <span>ប្រអប់ហាត់វាយ និងវិភាគលំដាប់គ្រាប់ចុចជាក់ស្ដែង (Interactive Keystroke Drill)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
              ជ្រើសរើសពាក្យខាងក្រោមដើម្បីមើលរបៀបចុច Key នីមួយៗ និងសាកល្បងវាយផ្ទៀងផ្ទាត់
            </p>
          </div>

          <Tag color="green" className="font-extrabold text-xs px-2.5 py-1 rounded-xl self-start sm:self-auto">
            Live Simulator
          </Tag>
        </div>

        {/* Word Selectors */}
        <div className="flex flex-wrap gap-2">
          {KHMER_PRACTICE_WORDS.map((item) => (
            <button
              key={item.word}
              onClick={() => {
                setSelectedWord(item);
                setTestInput("");
              }}
              className={`px-3.5 py-2 rounded-2xl font-black text-sm transition-all border ${
                selectedWord.word === item.word
                  ? "bg-[#52c41a] text-white border-[#52c41a] shadow-md -translate-y-0.5"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>{item.word}</span>
              <span className="text-[10px] ml-1.5 opacity-80 font-normal">({item.meaning})</span>
            </button>
          ))}
        </div>

        {/* Selected Word Details */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">ពាក្យគោលដៅ (Target Word)</div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
                {selectedWord.word}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {selectedWord.phonetic} • {selectedWord.meaning} • <Tag color="blue">{selectedWord.difficulty}</Tag>
              </div>
            </div>

            {/* Test Input Box */}
            <div className="sm:max-w-xs w-full space-y-1.5">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>សាកល្បងវាយពាក្យនេះ៖</span>
                {testInput && (
                  <span className={`text-xs font-extrabold ${isMatched ? "text-[#52c41a]" : "text-rose-500"}`}>
                    {isMatched ? "✓ ត្រឹមត្រូវល្អណាស់!" : "✗ មិនទាន់ត្រូវទេ"}
                  </span>
                )}
              </div>
              <Input
                size="large"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder={`វាយ "${selectedWord.word}" នៅទីនេះ...`}
                className={`font-black text-lg rounded-xl ${
                  isMatched
                    ? "!border-[#52c41a] !bg-emerald-50/50 dark:!bg-emerald-950/20"
                    : testInput
                    ? "!border-rose-400 !bg-rose-50/50 dark:!bg-rose-950/20"
                    : ""
                }`}
                allowClear
              />
            </div>
          </div>

          {/* Keystroke Sequence Diagram */}
          <div>
            <div className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <LuLayers size={14} className="text-[#52c41a]" />
              <span>លំដាប់គ្រាប់ចុចតាមលំដាប់ (Keystroke Breakdown Sequence):</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {selectedWord.keystrokes.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex flex-col items-center p-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-sm min-w-[72px]">
                    <span className="text-xs font-bold text-slate-400 mb-0.5">#{idx + 1}</span>
                    <span className="text-lg font-black text-[#52c41a]">{step.char}</span>
                    <span className="px-2 py-0.5 mt-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-black text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
                      {step.key}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium mt-1 text-center truncate max-w-[80px]">
                      {step.note}
                    </span>
                  </div>
                  {idx < selectedWord.keystrokes.length - 1 && (
                    <span className="text-slate-300 dark:text-slate-600 font-black text-lg">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMMON MISTAKES & HOW TO FIX */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <LuCircleAlert className="text-[#fa8c16] text-xl" />
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
              កំហុសទូទៅដែលគេតែងវាយខុស និងវិធីកែតម្រូវ (Common Typo Traps & Fixes)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              កុំវាយស្រៈផ្សំដែលធ្វើឱ្យខូចទម្រង់យូនីកូដ និង Search រកពាក្យមិនឃើញ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COMMON_MISTAKES.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs">
                    ❌ ខុស៖ {item.wrong}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    ✅ ត្រូវ៖ {item.correct}
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-[#52c41a] dark:text-[#52c41a]">
                  👉 {item.key}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 m-0 leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. INDEPENDENT VOWELS CHEATSHEET */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <LuType className="text-blue-500 text-xl" />
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
                តារាងស្រៈពេញតួ និងគ្រាប់ចុចក្តារចុច (Khmer Independent Vowels)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                ស្រៈពេញតួទាំង ១២ តួ និងគ្រាប់ចុច NIDA Keyboard សម្រាប់វាយ
              </p>
            </div>
          </div>
          <Tag color="blue" className="font-bold text-xs rounded-xl">
            12 Independent Vowels
          </Tag>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {INDEPENDENT_VOWELS.map((item) => (
            <div
              key={item.char}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1.5 hover:border-[#52c41a] transition-all"
            >
              <div className="text-2xl font-black text-slate-900 dark:text-white">{item.char}</div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.name}</div>
              <div className="inline-block px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 font-mono text-[10px] font-black text-[#52c41a] border border-slate-200 dark:border-slate-700">
                {item.key}
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate" title={item.example}>
                {item.example}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. DIACRITICS & PUNCTUATION MARKS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <LuBookOpen className="text-purple-500 text-xl" />
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
              វណ្ណយុត្តិ និងសញ្ញាពិសេសខ្មែរ (Khmer Diacritics & Punctuation)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              សញ្ញាសំខាន់ៗ និងរបៀបចុចលើ Keyboard
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {DIACRITICS_AND_PUNCTUATION.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl font-black text-[#52c41a] flex-shrink-0">
                {item.char}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {item.name}
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">
                    {item.key}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 m-0 leading-relaxed font-medium">
                  {item.use}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
