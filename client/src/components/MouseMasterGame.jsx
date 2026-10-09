import { useState, useEffect, useRef } from "react";
import { Button, Progress, Tag, Tooltip } from "antd";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuFlame,
  LuGift,
  LuMaximize,
  LuMinimize,
  LuMouse,
  LuMove,
  LuRefreshCw,
  LuRotateCcw,
  LuSparkles,
  LuStar,
  LuTarget,
  LuTrophy,
  LuVolume2,
  LuVolumeX,
  LuZap,
} from "react-icons/lu";

// Synthesized audio effects
function playMouseSound(type, isMuted = false) {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "pop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "chest" || type === "hatch") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.15, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.01, now + i * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.2);
      });
    } else if (type === "drop" || type === "hit") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "laser") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "win") {
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
    }
  } catch {}
}

const STAGES = [
  {
    id: "left-click-stars",
    stageNum: 1,
    titleKhmer: "វគ្គ ១៖ Single Click (ចុចឆ្វេងបំបែកពពុះផ្កាយ ៨)",
    titleEnglish: "Stage 1: Single Left-Click to pop all 8 colorful star bubbles!",
    instruction: "ប្រើម្រាមដៃចង្អុល ចុចប៊ូតុងឆ្វេង (Left-click) លើពពុះផ្កាយទាំង ៨ ដើម្បីបំបែកវា!",
    targetCount: 8,
  },
  {
    id: "double-click-eggs",
    stageNum: 2,
    titleKhmer: "វគ្គ ២៖ Double Click (ចុច ២ ដងគោះស៊ុតញាស់កូនសត្វ ៤)",
    titleEnglish: "Stage 2: Double-Click quickly to hatch all 4 mystery eggs!",
    instruction: "ចុចប៊ូតុងឆ្វេងពីរដងជាប់គ្នាឱ្យលឿន (Double-click) លើស៊ុតនីមួយៗដើម្បីញាស់យកកូនសត្វគួរឱ្យស្រឡាញ់!",
    targetCount: 4,
  },
  {
    id: "right-click-scanner",
    stageNum: 3,
    titleKhmer: "វគ្គ ៣៖ Right Click (ចុចស្តាំស្កេនមើលគ្រឿងសម្ងាត់ ៤)",
    titleEnglish: "Stage 3: Right-Click to inspect all 4 secret hardware cards!",
    instruction: "ចុចប៊ូតុងស្តាំនៃ Mouse (Right-click) លើកាតសម្ងាត់ដើម្បីស្កេនបង្ហាញគ្រឿងកុំព្យូទ័រ!",
    targetCount: 4,
  },
  {
    id: "hover-charge",
    stageNum: 4,
    titleKhmer: "វគ្គ ៤៖ Hover & Hold (ដាក់ Mouse ពីលើសាកថ្មគ្រីស្តាល់ ៤)",
    titleEnglish: "Stage 4: Hover over all 4 crystals for 1.5 seconds without clicking!",
    instruction: "រំកិលទ្រនិច Mouse ទៅដាក់ពីលើគ្រីស្តាល់នីមួយៗឱ្យបាន ១.៥ វិនាទី (ដោយមិនបាច់ចុច) ដើម្បីសាកថាមពល!",
    targetCount: 4,
  },
  {
    id: "drag-pc-build",
    stageNum: 5,
    titleKhmer: "វគ្គ ៥៖ Drag & Drop (អូសផ្គុំគ្រឿងកុំព្យូទ័រ ៤ មុខ)",
    titleEnglish: "Stage 5: Drag and drop all 4 computer components into the Case!",
    instruction: "ចុចសង្កត់ប៊ូតុងឆ្វេងឱ្យជាប់ រួចអូសគ្រឿង (CPU, RAM, GPU, Fan) ទៅទម្លាក់ក្នុងប្រអប់កុំព្យូទ័រ!",
    targetCount: 4,
  },
  {
    id: "drag-file-sort",
    stageNum: 6,
    titleKhmer: "វគ្គ ៦៖ File Sorting (ញែកឯកសារដាក់ក្នុងថត Folder ៤)",
    titleEnglish: "Stage 6: Drag each file into its matching colored Folder!",
    instruction: "អូសរូបភាពទៅថតរូប, ចម្រៀងទៅថតតន្ត្រី, វីដេអូទៅថតភាពយន្ត និងឯកសារទៅថតក្រដាស!",
    targetCount: 4,
  },
  {
    id: "speed-click-rocket",
    stageNum: 7,
    titleKhmer: "វគ្គ ៧៖ Rapid Click (ចុចប៊ូតុងឆ្វេង ១០ ដងបាញ់រ៉ុក្កែត)",
    titleEnglish: "Stage 7: Rapidly click the Rocket 10 times to launch it into space!",
    instruction: "ចុចប៊ូតុងឆ្វេងលើរ៉ុក្កែតឱ្យបានលឿនចំនួន ១០ ដង ដើម្បីបញ្ឆេះម៉ាស៊ីនហោះទៅឋានព្រះចន្ទ!",
    targetCount: 10,
  },
  {
    id: "circuit-trace",
    stageNum: 8,
    titleKhmer: "វគ្គ ៨៖ Path Tracing (អូស Mouse តាមខ្សែភ្លើងភ្ជាប់អំពូល)",
    titleEnglish: "Stage 8: Guide the electrical spark along the circuit track to light up the bulb!",
    instruction: "រំកិល Mouse តាមដានចំណុចអគ្គិសនីពីចំណុច A ដល់ចំណុច B ដោយកុំឱ្យចេញក្រៅគន្លង!",
    targetCount: 4,
  },
  {
    id: "ocean-scroll-quest",
    stageNum: 9,
    titleKhmer: "វគ្គ ៩៖ Scroll Wheel (រំកិលកង់ Mouse រើសត្បូង ៤ ក្នុងបាតសមុទ្រ)",
    titleEnglish: "Stage 9: Scroll down the deep ocean canyon to collect all 4 hidden ocean treasures!",
    instruction: "រំកិលកង់កណ្តាលនៃ Mouse (Scroll Wheel) ចុះក្រោមដើម្បីប្រមូលត្បូងសមុទ្រទាំង ៤!",
    targetCount: 4,
  },
  {
    id: "virus-cleanup-boss",
    stageNum: 10,
    titleKhmer: "វគ្គ ១០៖ Boss Battle (ចុចកម្ចាត់មេរោគលោត ៦ ក្បាល)",
    titleEnglish: "Stage 10: Whack all 6 funny malware bugs as they pop out of the windows!",
    instruction: "ប្រើ Mouse ចុចវាយលើមេរោគក្រហមដែលលោតចេញពីបង្អួចឱ្យបាន ៦ ក្បាលដើម្បីឈ្នះជើងឯក!",
    targetCount: 6,
  },
];

export default function MouseMasterGame({ onClose, embedded = false }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [floatingXp, setFloatingXp] = useState(null);

  // Stage 1: 8 Star Bubbles
  const [stars, setStars] = useState([
    { id: 1, x: 15, y: 25, color: "bg-sky-400", popped: false },
    { id: 2, x: 50, y: 18, color: "bg-emerald-400", popped: false },
    { id: 3, x: 80, y: 30, color: "bg-amber-400", popped: false },
    { id: 4, x: 25, y: 55, color: "bg-purple-400", popped: false },
    { id: 5, x: 75, y: 58, color: "bg-rose-400", popped: false },
    { id: 6, x: 38, y: 78, color: "bg-pink-400", popped: false },
    { id: 7, x: 65, y: 82, color: "bg-indigo-400", popped: false },
    { id: 8, x: 50, y: 48, color: "bg-yellow-400", popped: false },
  ]);

  // Stage 2: 4 Mystery Eggs
  const [eggs, setEggs] = useState([
    { id: 1, hatched: false, pet: "🐣", name: "Baby Chick" },
    { id: 2, hatched: false, pet: "🐱", name: "Kitty" },
    { id: 3, hatched: false, pet: "🐶", name: "Puppy" },
    { id: 4, hatched: false, pet: "🦄", name: "Unicorn" },
  ]);

  // Stage 3: 4 Secret Scanner Cards
  const [scanners, setScanners] = useState([
    { id: 1, scanned: false, icon: "🧠", title: "CPU Brain" },
    { id: 2, scanned: false, icon: "⚡", title: "RAM Fast" },
    { id: 3, scanned: false, icon: "🎨", title: "GPU Visual" },
    { id: 4, scanned: false, icon: "🛡️", title: "Firewall" },
  ]);

  // Stage 4: 4 Hover Crystals
  const [crystals, setCrystals] = useState([
    { id: 1, charge: 0, fullyCharged: false, color: "from-cyan-400 to-blue-500", icon: "💎" },
    { id: 2, charge: 0, fullyCharged: false, color: "from-emerald-400 to-teal-500", icon: "🟢" },
    { id: 3, charge: 0, fullyCharged: false, color: "from-purple-400 to-pink-500", icon: "🟣" },
    { id: 4, charge: 0, fullyCharged: false, color: "from-amber-400 to-orange-500", icon: "🟡" },
  ]);
  const hoverTimers = useRef({});

  // Stage 5: 4 Drag PC parts
  const [dragParts, setDragParts] = useState([
    { id: "cpu", name: "CPU (ខួរក្បាល)", icon: "🧠", dropped: false },
    { id: "ram", name: "RAM (តុធ្វើការ)", icon: "⚡", dropped: false },
    { id: "gpu", name: "GPU (កាតរូបភាព)", icon: "🎨", dropped: false },
    { id: "fan", name: "Cooler Fan (កង្ហារ)", icon: "🌀", dropped: false },
  ]);
  const [draggedItem, setDraggedItem] = useState(null);

  // Stage 6: 4 Files into matching folders
  const [files, setFiles] = useState([
    { id: "f-img", name: "Photo.png", icon: "🖼️", target: "folder-img", dropped: false },
    { id: "f-mus", name: "Song.mp3", icon: "🎵", target: "folder-mus", dropped: false },
    { id: "f-vid", name: "Movie.mp4", icon: "🎬", target: "folder-vid", dropped: false },
    { id: "f-doc", name: "Homework.pdf", icon: "📄", target: "folder-doc", dropped: false },
  ]);
  const [draggedFile, setDraggedFile] = useState(null);

  // Stage 7: Rocket click sprint
  const [rocketClicks, setRocketClicks] = useState(0);

  // Stage 8: Circuit tracing nodes
  const [nodesReached, setNodesReached] = useState([true, false, false, false]);

  // Stage 9: Ocean scroll items
  const [oceanGems, setOceanGems] = useState([
    { id: 1, depth: "25%", collected: false, icon: "🐚" },
    { id: 2, depth: "50%", collected: false, icon: "💎" },
    { id: 3, depth: "75%", collected: false, icon: "👑" },
    { id: 4, depth: "95%", collected: false, icon: "🪙" },
  ]);

  // Stage 10: Virus Whack-a-bug Boss
  const [activeBugWindow, setActiveBugWindow] = useState(1);
  const [bugsWhacked, setBugsWhacked] = useState(0);

  const stage = STAGES[currentStageIdx];

  function triggerXp(text) {
    setFloatingXp({ text, key: Date.now() });
  }

  function handleStageComplete() {
    triggerXp("+200 XP Stage Cleared!");
    if (currentStageIdx < STAGES.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
      setStageProgress(0);
    } else {
      const taken = Math.round((Date.now() - startTime) / 1000);
      setTotalTimeTaken(taken);
      playMouseSound("win", isMuted);
      setGameFinished(true);
    }
  }

  // --- STAGE 1: STARS POP ---
  function handlePopStar(id) {
    playMouseSound("pop", isMuted);
    setStars((prev) =>
      prev.map((s) => (s.id === id ? { ...s, popped: true } : s))
    );
    const count = stars.filter((s) => s.id === id || s.popped).length;
    setStageProgress(count);
    if (count >= 8) setTimeout(handleStageComplete, 500);
  }

  // --- STAGE 2: EGGS DOUBLE CLICK ---
  function handleHatchEgg(id) {
    playMouseSound("hatch", isMuted);
    setEggs((prev) =>
      prev.map((e) => (e.id === id ? { ...e, hatched: true } : e))
    );
    const count = eggs.filter((e) => e.id === id || e.hatched).length;
    setStageProgress(count);
    if (count >= 4) setTimeout(handleStageComplete, 500);
  }

  // --- STAGE 3: RIGHT CLICK SCANNER ---
  function handleScanRightClick(e, id) {
    e.preventDefault();
    playMouseSound("laser", isMuted);
    setScanners((prev) =>
      prev.map((s) => (s.id === id ? { ...s, scanned: true } : s))
    );
    const count = scanners.filter((s) => s.id === id || s.scanned).length;
    setStageProgress(count);
    if (count >= 4) setTimeout(handleStageComplete, 500);
  }

  // --- STAGE 4: HOVER CRYSTALS ---
  function handleCrystalEnter(id) {
    if (hoverTimers.current[id]) clearInterval(hoverTimers.current[id]);
    hoverTimers.current[id] = setInterval(() => {
      setCrystals((prev) =>
        prev.map((c) => {
          if (c.id !== id || c.fullyCharged) return c;
          const nextCharge = Math.min(100, c.charge + 20);
          if (nextCharge >= 100 && !c.fullyCharged) {
            playMouseSound("pop", isMuted);
            return { ...c, charge: 100, fullyCharged: true };
          }
          return { ...c, charge: nextCharge };
        })
      );
    }, 150);
  }

  function handleCrystalLeave(id) {
    if (hoverTimers.current[id]) {
      clearInterval(hoverTimers.current[id]);
      delete hoverTimers.current[id];
    }
  }

  useEffect(() => {
    if (stage.id === "hover-charge") {
      const chargedCount = crystals.filter((c) => c.fullyCharged).length;
      setStageProgress(chargedCount);
      if (chargedCount >= 4) {
        setTimeout(handleStageComplete, 500);
      }
    }
  }, [crystals, stage.id]);

  // --- STAGE 5: DRAG PARTS ---
  function handleDropPart() {
    if (!draggedItem) return;
    playMouseSound("drop", isMuted);
    setDragParts((prev) =>
      prev.map((p) => (p.id === draggedItem.id ? { ...p, dropped: true } : p))
    );
    const count = dragParts.filter((p) => p.id === draggedItem.id || p.dropped).length;
    setStageProgress(count);
    setDraggedItem(null);
    if (count >= 4) setTimeout(handleStageComplete, 500);
  }

  // --- STAGE 6: DRAG FILES TO FOLDERS ---
  function handleDropFile(folderTarget) {
    if (!draggedFile) return;
    if (draggedFile.target === folderTarget) {
      playMouseSound("drop", isMuted);
      setFiles((prev) =>
        prev.map((f) => (f.id === draggedFile.id ? { ...f, dropped: true } : f))
      );
      const count = files.filter((f) => f.id === draggedFile.id || f.dropped).length;
      setStageProgress(count);
      setDraggedFile(null);
      if (count >= 4) setTimeout(handleStageComplete, 500);
    } else {
      playMouseSound("hit", isMuted);
    }
  }

  // --- STAGE 7: ROCKET CLICK SPRINT ---
  function handleRocketClick() {
    playMouseSound("laser", isMuted);
    const next = rocketClicks + 1;
    setRocketClicks(next);
    setStageProgress(next);
    if (next >= 10) {
      playMouseSound("win", isMuted);
      setTimeout(handleStageComplete, 800);
    }
  }

  // --- STAGE 8: CIRCUIT TRACING ---
  function handleReachNode(idx) {
    if (idx > 0 && !nodesReached[idx - 1]) return; // Must be in sequence
    playMouseSound("pop", isMuted);
    setNodesReached((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
    setStageProgress(idx + 1);
    if (idx === 3) setTimeout(handleStageComplete, 600);
  }

  // --- STAGE 9: OCEAN SCROLL GEMS ---
  function handleCollectGem(id) {
    playMouseSound("chest", isMuted);
    setOceanGems((prev) =>
      prev.map((g) => (g.id === id ? { ...g, collected: true } : g))
    );
    const count = oceanGems.filter((g) => g.id === id || g.collected).length;
    setStageProgress(count);
    if (count >= 4) setTimeout(handleStageComplete, 600);
  }

  // --- STAGE 10: VIRUS WHACK BOSS ---
  useEffect(() => {
    if (stage.id === "virus-cleanup-boss" && bugsWhacked < 6) {
      const interval = setInterval(() => {
        setActiveBugWindow((prev) => {
          let next = Math.floor(Math.random() * 6) + 1;
          return next === prev ? (next % 6) + 1 : next;
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [stage.id, bugsWhacked]);

  function handleWhackBug(winId) {
    if (winId === activeBugWindow) {
      playMouseSound("hit", isMuted);
      const next = bugsWhacked + 1;
      setBugsWhacked(next);
      setStageProgress(next);
      setActiveBugWindow(0);
      if (next >= 6) {
        playMouseSound("win", isMuted);
        setTimeout(handleStageComplete, 800);
      }
    }
  }

  function restartGame() {
    setCurrentStageIdx(0);
    setStageProgress(0);
    setGameFinished(false);
    setStars((prev) => prev.map((s) => ({ ...s, popped: false })));
    setEggs((prev) => prev.map((e) => ({ ...e, hatched: false })));
    setScanners((prev) => prev.map((s) => ({ ...s, scanned: false })));
    setCrystals((prev) => prev.map((c) => ({ ...c, charge: 0, fullyCharged: false })));
    setDragParts((prev) => prev.map((p) => ({ ...p, dropped: false })));
    setFiles((prev) => prev.map((f) => ({ ...f, dropped: false })));
    setRocketClicks(0);
    setNodesReached([true, false, false, false]);
    setOceanGems((prev) => prev.map((g) => ({ ...g, collected: false })));
    setBugsWhacked(0);
  }

  // VICTORY CELEBRATION
  if (gameFinished) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f8fafc] text-slate-900 p-4 sm:p-8 backdrop-blur-md flex flex-col justify-center items-center">
        <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-scaleUp">
          <div className="text-7xl animate-bounce">🏆</div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 m-0">
              Mouse & Touchpad Legend!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              អបអរសាទរ! អ្នកបានឆ្លងផុតគ្រប់ទាំង ១០ វគ្គនៃការហាត់ប្រើ Mouse & Touchpad យ៉ាងស្ទាត់ជំនាញ!
            </p>
          </div>

          <div className="flex justify-center gap-2 text-[#fa8c16]">
            {[1, 2, 3, 4, 5].map((s) => (
              <LuStar key={s} size={32} className="fill-current animate-pulse" />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Stages Cleared</div>
              <div className="text-xl font-black text-[#52c41a] mt-0.5">10 / 10</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Time Taken</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{totalTimeTaken}s</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</div>
              <div className="text-xl font-black text-[#fa8c16] mt-0.5">100% ★</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              size="large"
              icon={<LuRotateCcw />}
              onClick={restartGame}
              className="flex-1 font-bold h-12 rounded-xl"
            >
              Play Again (លេងម្តងទៀត)
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<LuArrowLeft />}
              onClick={onClose || (() => setGameFinished(false))}
              className="flex-1 font-bold h-12 bg-[#52c41a] hover:!bg-[#46aa16] border-0 rounded-xl"
            >
              Done (រួចរាល់)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const containerClasses =
    embedded && !isFullscreen
      ? "relative w-full rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-3 sm:p-6 shadow-sm flex flex-col justify-between select-none min-h-[640px]"
      : "fixed inset-0 z-50 overflow-y-auto bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 sm:p-6 backdrop-blur-md flex flex-col justify-between select-none";

  return (
    <div className={containerClasses}>
      {/* FLOATING XP */}
      {floatingXp && (
        <div
          key={floatingXp.key}
          className="fixed top-16 right-8 pointer-events-none z-50 animate-bounce"
        >
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-sm shadow-xl flex items-center gap-1.5">
            <LuZap className="fill-current" />
            <span>{floatingXp.text}</span>
          </div>
        </div>
      )}

      {/* 1. TOP GAME HUD & STAGE PICKER */}
      <div className="w-full max-w-3xl mx-auto space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            {onClose ? (
              <Button
                type="text"
                icon={<LuArrowLeft />}
                onClick={onClose}
                className="text-slate-600 dark:text-slate-300 font-bold p-2 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
              />
            ) : isFullscreen ? (
              <Button
                type="text"
                icon={<LuMinimize />}
                onClick={() => setIsFullscreen(false)}
                className="text-slate-600 dark:text-slate-300 font-bold p-2 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
              />
            ) : null}
            <div className="flex items-center gap-2 truncate">
              <span className="text-xl sm:text-2xl p-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">🖱️</span>
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block leading-tight">
                  Mouse & Touchpad Master
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  10 Interactive Skill Stages
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              Stage {stage.stageNum}/10
            </span>

            <Tooltip title={isMuted ? "Unmute" : "Mute"}>
              <Button
                shape="circle"
                type="text"
                size="small"
                icon={isMuted ? <LuVolumeX /> : <LuVolume2 />}
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              />
            </Tooltip>

            {embedded && (
              <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                <Button
                  shape="circle"
                  type="text"
                  size="small"
                  icon={isFullscreen ? <LuMinimize /> : <LuMaximize />}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                />
              </Tooltip>
            )}
          </div>
        </div>

        {/* 10 STAGE QUICK SELECTOR PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 custom-scrollbar">
          {STAGES.map((stg, idx) => (
            <button
              key={stg.id}
              onClick={() => {
                setCurrentStageIdx(idx);
                setStageProgress(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 cursor-pointer ${
                idx === currentStageIdx
                  ? "bg-slate-900 dark:bg-emerald-500 text-white shadow-xs"
                  : idx < currentStageIdx
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              #{idx + 1} {stg.id.split("-")[0]}
            </button>
          ))}
        </div>

        <Progress
          percent={((currentStageIdx + 1) / 10) * 100}
          showInfo={false}
          strokeColor={{ "0%": "#52c41a", "100%": "#fa8c16" }}
          railColor="#e2e8f0"
          size={["100%", 7]}
          className="m-0"
        />
      </div>

      {/* 2. MAIN STAGE PLAY ARENA */}
      <div className="w-full max-w-3xl mx-auto my-auto py-3 space-y-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xl text-center relative overflow-hidden">
          <div className="inline-block px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
            {stage.titleKhmer}
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 m-0">
            {stage.instruction}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5 m-0">
            {stage.titleEnglish}
          </p>

          {/* PROGRESS SUB-BAR */}
          <div className="flex items-center justify-center gap-2 mt-3 text-xs font-bold text-slate-500">
            <span>Progress:</span>
            <span className="text-[#52c41a]">{stageProgress} / {stage.targetCount} Completed</span>
          </div>

          {/* DYNAMIC CANVAS PER STAGE */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-[320px] flex items-center justify-center relative overflow-hidden">
            {/* STAGE 1: 8 STAR BUBBLES */}
            {stage.id === "left-click-stars" && (
              <div className="w-full h-72 relative">
                {stars.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handlePopStar(s.id)}
                    style={{ left: `${s.x}%`, top: `${s.y}%` }}
                    className={`absolute w-13 h-13 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer ${
                      s.popped
                        ? "scale-0 opacity-0 pointer-events-none"
                        : `${s.color} hover:scale-120 active:scale-90 animate-bounce`
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            )}

            {/* STAGE 2: 4 EGGS DOUBLE CLICK */}
            {stage.id === "double-click-eggs" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                {eggs.map((e) => (
                  <button
                    key={e.id}
                    onDoubleClick={() => handleHatchEgg(e.id)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer shadow-md ${
                      e.hatched
                        ? "bg-amber-50 border-amber-400 scale-105"
                        : "bg-white border-slate-300 hover:border-amber-400 hover:shadow-lg active:scale-95"
                    }`}
                  >
                    <span className="text-4xl">{e.hatched ? e.pet : "🥚"}</span>
                    <span className="text-xs font-bold text-slate-700 mt-2">
                      {e.hatched ? e.name : "Double-Click!"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {e.hatched ? "HATCHED ✓" : "[2x Click]"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* STAGE 3: 4 RIGHT CLICK SCANNERS */}
            {stage.id === "right-click-scanner" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                {scanners.map((s) => (
                  <div
                    key={s.id}
                    onContextMenu={(e) => handleScanRightClick(e, s.id)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-context-menu shadow-md ${
                      s.scanned
                        ? "bg-emerald-50 border-emerald-400 scale-105"
                        : "bg-white border-slate-300 hover:border-purple-400 hover:shadow-lg"
                    }`}
                  >
                    <span className="text-4xl mb-1">{s.scanned ? s.icon : "🔍"}</span>
                    <span className="text-xs font-bold text-slate-800">
                      {s.scanned ? s.title : "Right-Click Card"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-1">
                      {s.scanned ? "SCANNED ✓" : "[Right Click]"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* STAGE 4: 4 HOVER CRYSTALS */}
            {stage.id === "hover-charge" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                {crystals.map((c) => (
                  <div
                    key={c.id}
                    onMouseEnter={() => handleCrystalEnter(c.id)}
                    onMouseLeave={() => handleCrystalLeave(c.id)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer shadow-md bg-white ${
                      c.fullyCharged
                        ? "border-emerald-500 bg-emerald-50 scale-105"
                        : "border-slate-300 hover:border-cyan-400"
                    }`}
                  >
                    <span className="text-4xl mb-2">{c.icon}</span>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full bg-gradient-to-r ${c.color} transition-all duration-150`}
                        style={{ width: `${c.charge}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-2">
                      {c.fullyCharged ? "CHARGED 100% ✓" : `Hover: ${c.charge}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* STAGE 5: 4 DRAG PC PARTS */}
            {stage.id === "drag-pc-build" && (
              <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5">
                  {dragParts.map((p) => (
                    <div
                      key={p.id}
                      draggable={!p.dropped}
                      onDragStart={() => setDraggedItem(p)}
                      className={`p-2.5 px-4 rounded-xl border flex items-center gap-2 font-bold text-xs shadow-sm transition-all ${
                        p.dropped
                          ? "bg-slate-100 border-slate-200 opacity-30 cursor-not-allowed"
                          : "bg-white border-emerald-300 hover:border-emerald-500 cursor-grab active:cursor-grabbing hover:shadow-md"
                      }`}
                    >
                      <span className="text-xl">{p.icon}</span>
                      <span>{p.name}</span>
                    </div>
                  ))}
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropPart}
                  className="w-56 h-56 rounded-3xl border-3 border-dashed border-emerald-400 bg-emerald-50/70 flex flex-col items-center justify-center text-center p-4 transition-all hover:bg-emerald-100/60"
                >
                  <span className="text-5xl mb-1">🖥️</span>
                  <span className="text-xs font-bold text-emerald-950">
                    ទម្លាក់គ្រឿងចូលទីនេះ (PC Case Slot)
                  </span>
                  <span className="text-[11px] text-emerald-700 mt-1 font-bold">
                    {dragParts.filter((p) => p.dropped).length} / 4 Installed
                  </span>
                </div>
              </div>
            )}

            {/* STAGE 6: FILE SORTING */}
            {stage.id === "drag-file-sort" && (
              <div className="w-full space-y-6">
                {/* 4 Draggable files */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      draggable={!f.dropped}
                      onDragStart={() => setDraggedFile(f)}
                      className={`p-2.5 px-4 rounded-xl border flex items-center gap-2 font-bold text-xs shadow-sm transition-all ${
                        f.dropped
                          ? "bg-slate-100 border-slate-200 opacity-20 cursor-not-allowed"
                          : "bg-white border-blue-300 hover:border-blue-500 cursor-grab active:cursor-grabbing hover:shadow-md"
                      }`}
                    >
                      <span className="text-xl">{f.icon}</span>
                      <span>{f.name}</span>
                    </div>
                  ))}
                </div>

                {/* 4 Destination Folders */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "folder-img", name: "Pictures", icon: "📁", color: "border-pink-300 bg-pink-50" },
                    { id: "folder-mus", name: "Music", icon: "📁", color: "border-amber-300 bg-amber-50" },
                    { id: "folder-vid", name: "Videos", icon: "📁", color: "border-purple-300 bg-purple-50" },
                    { id: "folder-doc", name: "Documents", icon: "📁", color: "border-blue-300 bg-blue-50" },
                  ].map((folder) => (
                    <div
                      key={folder.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropFile(folder.id)}
                      className={`p-4 rounded-2xl border-2 border-dashed ${folder.color} flex flex-col items-center justify-center text-center transition-all hover:scale-105`}
                    >
                      <span className="text-3xl mb-1">{folder.icon}</span>
                      <span className="text-xs font-bold text-slate-800">{folder.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAGE 7: ROCKET CLICK SPRINT */}
            {stage.id === "speed-click-rocket" && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <button
                  onClick={handleRocketClick}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-rose-500 via-amber-500 to-yellow-400 text-white shadow-2xl flex flex-col items-center justify-center transition-all active:scale-90 hover:scale-105 cursor-pointer"
                >
                  <span className="text-5xl sm:text-6xl animate-bounce">🚀</span>
                  <span className="text-xs font-black uppercase mt-1">CLICK ME!</span>
                </button>
                <div className="text-center font-bold text-sm text-slate-700">
                  ⚡ Clicks: <span className="text-xl font-black text-rose-600">{rocketClicks}</span> / 10
                </div>
              </div>
            )}

            {/* STAGE 8: CIRCUIT TRACING */}
            {stage.id === "circuit-trace" && (
              <div className="w-full flex items-center justify-between px-6 sm:px-12 relative">
                <div className="absolute left-8 right-8 top-1/2 h-2 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
                {["🔋 Power", "⚡ Wire 1", "⚡ Wire 2", "💡 Bulb"].map((label, idx) => (
                  <button
                    key={idx}
                    onMouseEnter={() => handleReachNode(idx)}
                    className={`relative z-10 w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-md ${
                      nodesReached[idx]
                        ? "bg-amber-400 border-amber-500 text-slate-950 font-bold scale-110"
                        : "bg-white border-slate-300 text-slate-400"
                    }`}
                  >
                    <span className="text-xl">{label.split(" ")[0]}</span>
                    <span className="text-[9px] font-bold">{label.split(" ")[1]}</span>
                  </button>
                ))}
              </div>
            )}

            {/* STAGE 9: OCEAN SCROLL GEMS */}
            {stage.id === "ocean-scroll-quest" && (
              <div className="w-full h-72 overflow-y-auto rounded-2xl bg-gradient-to-b from-sky-400 via-blue-700 to-slate-950 p-4 text-white relative custom-scrollbar shadow-inner">
                <div className="h-[1200px] flex flex-col justify-between items-center py-4">
                  <div className="text-center bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold">
                    🌊 ផ្ទៃសមុទ្រ (Surface) — រំកិលកង់ Mouse ចុះក្រោមដើម្បីប្រមូលត្បូង! ↓
                  </div>

                  {oceanGems.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleCollectGem(g.id)}
                      className={`p-3 px-5 rounded-2xl font-black text-sm shadow-xl transition-all cursor-pointer ${
                        g.collected
                          ? "bg-emerald-500 text-white scale-90 opacity-60 pointer-events-none"
                          : "bg-amber-400 text-slate-950 hover:scale-110 animate-bounce"
                      }`}
                    >
                      {g.collected ? `COLLECTED ${g.icon} ✓` : `ចុចរើសយក ${g.icon}!`}
                    </button>
                  ))}

                  <div className="text-center font-bold text-xs opacity-70">
                    ⚓ បាតសមុទ្រជ្រៅ (Ocean Floor)
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 10: VIRUS WHACK BOSS */}
            {stage.id === "virus-cleanup-boss" && (
              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
                {[1, 2, 3, 4, 5, 6].map((winId) => {
                  const hasBug = winId === activeBugWindow;
                  return (
                    <button
                      key={winId}
                      onClick={() => handleWhackBug(winId)}
                      className={`h-24 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-md relative overflow-hidden ${
                        hasBug
                          ? "bg-rose-50 border-rose-500 hover:scale-105 active:scale-95 cursor-pointer"
                          : "bg-white border-slate-200 opacity-60"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-400 absolute top-1.5 left-2">
                        Win #{winId}
                      </span>
                      {hasBug ? (
                        <div className="flex flex-col items-center animate-bounce">
                          <span className="text-4xl">👾</span>
                          <span className="text-[10px] font-black text-rose-600 mt-1 uppercase">
                            WHACK ME!
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl text-slate-300">🛡️</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
