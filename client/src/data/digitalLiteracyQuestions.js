// Backwards compatibility re-export from the new modular quiz architecture
export {
  quizCategories as digitalLiteracyTopics,
  quizCategories,
  quizCategoryGroups,
  quizSessionLengths,
  getCategoryById,
  getAllQuestions,
  sampleCategoryQuestions,
} from "./quiz/index.js";
