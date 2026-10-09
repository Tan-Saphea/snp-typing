import { aiTechnologyCategory } from "./aiTechnology.js";
import { cyberSafetyCategory } from "./cyberSafety.js";
import { excelDataCategory } from "./excelData.js";
import { hardwareCategory } from "./hardware.js";
import { internetToolsCategory } from "./internetTools.js";
import { presentationCategory } from "./presentation.js";
import { shortcutsCategory } from "./shortcuts.js";
import { wordProcessingCategory } from "./wordProcessing.js";

export const quizCategories = [
  hardwareCategory,
  cyberSafetyCategory,
  shortcutsCategory,
  internetToolsCategory,
  wordProcessingCategory,
  excelDataCategory,
  presentationCategory,
  aiTechnologyCategory,
];

// Group definitions for easy filtering & navigation
export const quizCategoryGroups = [
  { id: "all", label: "All Topics (ទាំងអស់)" },
  { id: "fundamentals", label: "Computer Basics (មូលដ្ឋានគ្រឹះ)" },
  { id: "security", label: "Cyber Safety (សុវត្ថិភាព)" },
  { id: "productivity", label: "Productivity (ប្រសិទ្ធភាព)" },
  { id: "office", label: "Office Apps (Word/Excel/PPT)" },
  { id: "future", label: "AI & Future Tech (បច្ចេកវិទ្យា)" },
];

// Robust Fisher-Yates array shuffling algorithm
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Randomize options for a question while maintaining the correct answerIndex
export function shuffleQuestionOptions(question) {
  if (!question || !Array.isArray(question.options) || question.options.length <= 1) {
    return question;
  }

  const originalCorrectOption = question.options[question.answerIndex ?? 0];
  const shuffledOptions = shuffleArray(question.options);
  const newAnswerIndex = shuffledOptions.indexOf(originalCorrectOption);

  return {
    ...question,
    options: shuffledOptions,
    answerIndex: newAnswerIndex !== -1 ? newAnswerIndex : question.answerIndex,
  };
}

export function getCategoryById(id) {
  return quizCategories.find((cat) => cat.id === id) || null;
}

export function getAllQuestions() {
  return quizCategories.flatMap((cat) => cat.questions);
}

// Sample and fully randomize questions and their 4 answer choices
export function sampleCategoryQuestions(categoryId, count = 10) {
  const category = getCategoryById(categoryId);
  if (!category || !category.questions.length) return [];

  const shuffled = shuffleArray(category.questions);
  const selected = !count || count >= shuffled.length ? shuffled : shuffled.slice(0, count);

  return selected.map((q) => shuffleQuestionOptions(q));
}

// Session length choices
export const quizSessionLengths = [
  { value: 5, label: "Quick Quiz (៥ សំណួរ)", desc: "Quick 3-minute practice" },
  { value: 10, label: "Standard Test (១០ សំណួរ)", desc: "Recommended balanced challenge" },
  { value: 25, label: "Mastery Marathon (២៥ សំណួរ)", desc: "Deep knowledge assessment" },
  { value: 30, label: "Complete Category (៣០ សំណួរ)", desc: "All questions in this topic" },
];
