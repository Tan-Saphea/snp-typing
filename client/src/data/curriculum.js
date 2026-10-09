export const curriculumLevels = {
  en: [
    { level: 1, icon: "⌨", title: "Keyboard Basics", description: "Learn the home row, alphabet keys, spaces, and capitals." },
    { level: 2, icon: "ABC", title: "Easy Words", description: "Build confidence with short, familiar words." },
    { level: 3, icon: "Aa", title: "Long Words", description: "Practice two-, three-, and four-syllable words." },
    { level: 4, icon: "◆", title: "Topic Vocabulary", description: "Type words about shapes, school things, and colors." },
    { level: 5, icon: "✎", title: "Sentences", description: "Build fluent rhythm with age-appropriate sentences and accuracy-first speed goals." },
    { level: 6, icon: "¶", title: "Paragraphs", description: "Type four sentences, then progress to complete passages without repeated filler." },
    { level: 7, icon: "★", title: "Stories", description: "Build speed, stamina, and comprehension with meaningful stories." },
  ],
  km: [
    { level: 1, icon: "ក", title: "ព្យញ្ជនៈ", description: "រៀនវាយព្យញ្ជនៈខ្មែរម្តងមួយក្រុម។" },
    { level: 2, icon: "កា", title: "ស្រៈ ជើងអក្សរ និងការផ្សំ", description: "ហាត់វាយស្រៈនិស្ស័យ ជើងអក្សរ (Key J) ស្រៈពេញតួ (ឥ ឦ ឧ ឩ ឪ ឫ ឬ ឭ ឮ ឯ ឰ ឱ ឲ ឳ) និងការផ្សំព្យញ្ជនៈ។" },
    { level: 3, icon: "ពាក្យ", title: "ពាក្យ", description: "វាយពាក្យខ្មែរដែលប្រើជាប្រចាំ។" },
    { level: 4, icon: "។", title: "ប្រយោគ", description: "ហាត់ប្រយោគមានន័យ ដោយផ្តោតលើភាពត្រឹមត្រូវ និងចង្វាក់ថេរ។" },
    { level: 5, icon: "¶", title: "កថាខណ្ឌ", description: "បង្កើនល្បឿនជាមួយកថាខណ្ឌពេញលេញ ដែលមិនមានប្រយោគដដែលៗ។" },
    { level: 6, icon: "★", title: "អត្ថបទ", description: "អានជាមុន រួចវាយអត្ថបទវែងដោយល្បឿន និងភាពត្រឹមត្រូវ។" },
  ],
};

const curriculumCategories = {
  en: new Set(["keyboard-basics", "easy-words", "syllable-words", "shapes", "school-things", "colors", "sentences", "paragraphs", "stories"]),
  km: new Set(["khmer-consonants", "khmer-combinations", "khmer-coeng", "khmer-independent-vowels", "khmer-words", "khmer-sentences", "khmer-paragraphs", "khmer-advanced"]),
};

export function isCurriculumLesson(lesson) {
  return curriculumCategories[lesson.language]?.has(lesson.category) ?? false;
}

export function getLevel(language, level) {
  return curriculumLevels[language]?.find((item) => item.level === Number(level));
}

export function languageLabel(language) {
  return language === "km" ? "Khmer Typing" : "English Typing";
}
