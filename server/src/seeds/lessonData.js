import {
  buildLessonTargetText,
  countLessonTargetGraphemes,
  LESSON_TARGET_MAX_GRAPHEMES,
  LESSON_TARGET_MIN_GRAPHEMES,
  segmentGraphemes,
} from "@snp/shared";

const specificationBook = "SNP Typing Product Specification";
const authoredBook = "SNP Typing Authored Curriculum";
const pendingBook = "Microsoft Word for Children - attachment required";
const fluencyLessonTypes = new Set(["sentence", "paragraph", "story"]);

function source(exercise, contentStatus = "verified", sourceBook = specificationBook) {
  const reviewStatus = contentStatus === "needs_review"
    ? "needs-review"
    : contentStatus === "verified"
      ? "verified"
      : contentStatus === "custom"
        ? "approved"
        : "adapted";
  return {
    sourceBook,
    sourceExercise: exercise,
    reviewStatus,
    reviewNotes: contentStatus === "needs_review"
      ? "The source PDF is not present. An administrator must verify the exact page and wording before publishing."
      : contentStatus === "custom"
        ? "Original SNP Typing lesson approved by automated curriculum, Unicode, and keyboard-coverage checks."
        : "Created from content explicitly supplied in the SNP Typing specification.",
  };
}

function flattenBlocks(blocks) {
  return blocks.flatMap((block) => {
    if (block.kind === "picture" && block.answer) return [block.answer];
    if (["items", "sentences"].includes(block.kind) && block.items?.length) return block.items;
    if (block.text) return [block.text];
    if (block.items?.length) return block.items;
    if (block.answer) return [block.answer];
    return [];
  });
}

function lessonTargetCount(blocks, language) {
  return countLessonTargetGraphemes({ language, content: { blocks } });
}

function trimTextAtNaturalBoundary(value, language, maximum) {
  const locale = language === "km" ? "km" : "en";
  const clipped = segmentGraphemes(value, locale).slice(0, maximum).join("");
  const punctuation = [...clipped.matchAll(/[.!?។៕](?=\s|$)/gu)].at(-1);
  const punctuationEnd = punctuation ? punctuation.index + punctuation[0].length : -1;

  if (punctuationEnd >= LESSON_TARGET_MIN_GRAPHEMES) return clipped.slice(0, punctuationEnd).trimEnd();

  const wordEnd = Math.max(clipped.lastIndexOf(" "), clipped.lastIndexOf("\n"));
  if (wordEnd >= LESSON_TARGET_MIN_GRAPHEMES) return clipped.slice(0, wordEnd).trimEnd();
  return clipped.trimEnd();
}

function normalizeLessonBlocks(blocks, language, type, contentStatus) {
  const normalized = blocks.map((block) => ({
    ...block,
    ...(block.items ? { items: [...block.items] } : {}),
    ...(block.options ? { options: [...block.options] } : {}),
  }));

  if (type === "game" || contentStatus === "needs_review") return normalized;

  let count = lessonTargetCount(normalized, language);
  if (count < LESSON_TARGET_MIN_GRAPHEMES) {
    if (fluencyLessonTypes.has(type)) {
      throw new Error(`${language.toUpperCase()} ${type} lesson contains only ${count} original graphemes; write at least ${LESSON_TARGET_MIN_GRAPHEMES} instead of repeating content.`);
    }

    const itemIndex = normalized.findLastIndex((block) => ["items", "sentences"].includes(block.kind) && block.items?.length);

    if (itemIndex >= 0) {
      const sourceItems = [...normalized[itemIndex].items];
      while (count < LESSON_TARGET_MIN_GRAPHEMES) {
        normalized[itemIndex].items.push(...sourceItems);
        count = lessonTargetCount(normalized, language);
      }
    } else {
      const textIndex = normalized.findLastIndex((block) => block.kind !== "picture" && block.text);
      if (textIndex >= 0) {
        const sourceText = normalized[textIndex].text;
        const separator = normalized[textIndex].kind === "formatting" ? "\n" : " ";
        while (count < LESSON_TARGET_MIN_GRAPHEMES) {
          normalized[textIndex].text += `${separator}${sourceText}`;
          count = lessonTargetCount(normalized, language);
        }
      } else {
        const pictureAnswers = normalized.map((block) => block.answer).filter(Boolean);
        if (pictureAnswers.length) {
          const practiceBlock = { kind: "items", items: [] };
          normalized.push(practiceBlock);
          while (count < LESSON_TARGET_MIN_GRAPHEMES) {
            practiceBlock.items.push(...pictureAnswers);
            count = lessonTargetCount(normalized, language);
          }
        }
      }
    }
  }

  count = lessonTargetCount(normalized, language);
  if (count > LESSON_TARGET_MAX_GRAPHEMES) {
    const textIndex = normalized.findLastIndex((block) => block.kind !== "picture" && block.text);
    if (textIndex >= 0) {
      const otherBlocks = normalized.filter((_, index) => index !== textIndex);
      const otherCount = otherBlocks.length ? lessonTargetCount(otherBlocks, language) + 2 : 0;
      normalized[textIndex].text = trimTextAtNaturalBoundary(
        normalized[textIndex].text,
        language,
        LESSON_TARGET_MAX_GRAPHEMES - otherCount,
      );
    } else {
      const itemIndex = normalized.findLastIndex((block) => block.items?.length);
      while (itemIndex >= 0 && normalized[itemIndex].items.length > 1 && lessonTargetCount(normalized, language) > LESSON_TARGET_MAX_GRAPHEMES) {
        normalized[itemIndex].items.pop();
      }
    }
  }

  const finalCount = lessonTargetCount(normalized, language);
  if (finalCount < LESSON_TARGET_MIN_GRAPHEMES || finalCount > LESSON_TARGET_MAX_GRAPHEMES) {
    throw new Error(`Lesson target must contain ${LESSON_TARGET_MIN_GRAPHEMES}-${LESSON_TARGET_MAX_GRAPHEMES} graphemes; received ${finalCount}.`);
  }

  return normalized;
}

function lesson({
  title,
  titleKhmer = "",
  slug,
  language,
  level,
  order,
  category,
  type,
  blocks,
  difficulty = "easy",
  instructions,
  contentStatus = "verified",
  isPublished = contentStatus !== "needs_review",
  sourceBook,
  sourceExercise,
  minimumAccuracy,
  minimumSpeed,
  timeLimit = 0,
  unlockTrack,
  prerequisiteSlug,
  tags = [],
}) {
  const resolvedSourceBook = sourceBook ?? (contentStatus === "custom" ? authoredBook : specificationBook);
  const metadata = source(sourceExercise ?? title, contentStatus, resolvedSourceBook);
  const normalizedBlocks = normalizeLessonBlocks(blocks, language, type, contentStatus);
  const isFluencyLesson = fluencyLessonTypes.has(type);
  const accuracyByDifficulty = difficulty === "challenge" ? 92 : difficulty === "medium" ? 90 : 88;
  const speedBoost = difficulty === "challenge" ? (language === "km" ? 5 : 2) : difficulty === "medium" ? (language === "km" ? 3 : 1) : 0;
  const baseSpeed = language === "km" ? Math.max(20, (level - 3) * 5 + 15) : Math.max(8, (level - 4) * 2 + 8);
  return {
    title,
    titleKhmer,
    description: instructions,
    slug,
    language,
    category,
    level,
    order,
    difficulty,
    type,
    instructions,
    contentItems: flattenBlocks(normalizedBlocks),
    content: { keyboardLayout: language, blocks: normalizedBlocks },
    source: metadata,
    sourceBook: metadata.sourceBook,
    sourceExercise: metadata.sourceExercise,
    contentStatus,
    minimumAccuracy: minimumAccuracy ?? (isFluencyLesson ? accuracyByDifficulty : 70),
    minimumSpeed: minimumSpeed ?? (isFluencyLesson ? baseSpeed + speedBoost : 0),
    timeLimit,
    starsEnabled: true,
    allowBackspace: true,
    isLocked: false,
    isPublished,
    isActive: true,
    tags,
    unlockTrack,
    prerequisiteSlug,
  };
}

function itemLesson(options) {
  return lesson({ ...options, blocks: [{ kind: "items", items: options.items }] });
}

function sentenceLesson(options) {
  return lesson({ ...options, type: "sentence", blocks: [{ kind: "sentences", items: options.items }] });
}

function paragraphLesson(options) {
  return lesson({ ...options, type: "paragraph", blocks: [{ kind: "paragraph", text: options.text }] });
}

function chunks(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

const englishTrack = "en-curriculum";
const khmerTrack = "km-curriculum";
const skillTrack = "computer-skills";

const englishLevel1Data = [
  ["A S D F", "en-basics-01-asdf", ["a a a a", "s s s s", "d d d d", "f f f f", "asdf", "fdsa"]],
  ["J K L ;", "en-basics-02-jkl", ["j j j j", "k k k k", "l l l l", "; ; ; ;", "jkl;", ";lkj"]],
  ["Home Row", "en-basics-03-home-row", ["asdf jkl;", "sad dad", "fall ask", "flask", "all"]],
  ["Q W E R T", "en-basics-04-qwert", ["q q w w", "e e r r", "t t t t", "qwert", "tree"]],
  ["Y U I O P", "en-basics-05-yuiop", ["y y u u", "i i o o", "p p p p", "yuiop", "your"]],
  ["Z X C V B", "en-basics-06-zxcvb", ["z z x x", "c c v v", "b b b b", "zxcvb", "box"]],
  ["N M", "en-basics-07-nm", ["n n n n", "m m m m", "nm nm", "man", "name"]],
  ["Full Alphabet", "en-basics-08-alphabet", ["abcdefghijklmnopqrstuvwxyz", "the quick brown fox jumps over the lazy dog"]],
  ["Space Bar", "en-basics-09-space", ["a cat", "a red hat", "my school", "we can type", "keep a space"]],
  ["Capital Letters", "en-basics-10-shift", ["A B C", "My School", "English", "SNP Typing", "Dara Can Type"]],
  ["Period and Comma", "en-basics-11-period-comma", ["cat, dog, sun", "I can type.", "red, blue, green", "Stop, look, and listen."]],
  ["Question Mark", "en-basics-12-question", ["How are you?", "What is this?", "Can you type?", "Where is my book?"]],
  ["Numbers", "en-basics-13-numbers", ["1 2 3 4 5", "6 7 8 9 0", "12345", "2026", "10 pencils"]],
  ["Full Review", "en-basics-14-review", ["My school is clean.", "I have a blue pencil.", "Can you type 10 words?", "SNP Typing is fun!"]],
];

const englishLevel1 = englishLevel1Data.map(([title, slug, items], index) => itemLesson({
  title,
  slug,
  language: "en",
  category: "keyboard-basics",
  level: 1,
  order: index + 1,
  type: "letter",
  items,
  difficulty: index >= 13 ? "challenge" : "beginner",
  instructions: "Keep your hands relaxed and type each line carefully.",
  sourceExercise: `English Level 1 - Lesson ${index + 1}`,
  unlockTrack: englishTrack,
}));

const easyWords = `cat dog sun hat map bat man fan pan cap bed red pen hen ten run fun bun cup nut pig big dig wig lip zip sit fit hit kit hop top mop pop pot hot box fox ox jet web leg bag tag rag jam ram yam can van clap trap snap flag frog drum star hand fish wish milk ball wall call doll bell sell tell yell jump pink ring king sing long song fast last best nest sand land band cold gold hold bold duck luck back pack sack neck peck rock lock sock ship shop stop`.split(" ");
const easyWordChunks = chunks(easyWords, 10);
const englishLevel2 = [
  ...easyWordChunks.map((items, index) => itemLesson({
    title: `Easy Words ${index + 1}`,
    slug: `en-easy-words-${String(index + 1).padStart(2, "0")}`,
    language: "en",
    category: "easy-words",
    level: 2,
    order: index + 1,
    type: "word",
    items,
    instructions: "Type each short word carefully. Accuracy comes before speed.",
    sourceExercise: `English Level 2 - Word Set ${index + 1}`,
    unlockTrack: englishTrack,
  })),
  itemLesson({ title: "Easy Words Review 1", slug: "en-easy-review-01", language: "en", category: "easy-words", level: 2, order: easyWordChunks.length + 1, type: "word", items: easyWords.filter((_, index) => index % 3 === 0).slice(0, 18), instructions: "Review words from the first half of this level.", sourceExercise: "English Level 2 Review 1", difficulty: "medium", unlockTrack: englishTrack }),
  itemLesson({ title: "Easy Words Review 2", slug: "en-easy-review-02", language: "en", category: "easy-words", level: 2, order: easyWordChunks.length + 2, type: "word", items: easyWords.filter((_, index) => index % 3 === 1).slice(-18), instructions: "Review words from the second half of this level.", sourceExercise: "English Level 2 Review 2", difficulty: "medium", unlockTrack: englishTrack }),
  itemLesson({ title: "Easy Words Speed Challenge", slug: "en-easy-speed-challenge", language: "en", category: "easy-words", level: 2, order: easyWordChunks.length + 3, type: "word", items: easyWords.filter((_, index) => index % 5 === 0), instructions: "Type the mixed words smoothly while keeping at least 70% accuracy.", sourceExercise: "English Level 2 Speed Challenge", difficulty: "challenge", timeLimit: 90, unlockTrack: englishTrack }),
];

const twoSyllables = "apple baby tiger flower yellow robot pencil bunny jacket window table garden basket cookie rainbow spider chicken butter rocket wagon".split(" ");
const threeSyllables = "banana elephant butterfly computer tomato animal avocado dinosaur potato telephone important mosquito tomorrow lemonade discovery chocolate universe dangerous".split(" ");
const fourSyllables = "calculator watermelon appreciation imagination education invitation celebration information cooperation conversation".split(" ");
const englishLevel3 = [
  ...chunks(twoSyllables, 10).map((items, index) => itemLesson({ title: `Two-Syllable Words ${index + 1}`, slug: `en-syllables-two-${index + 1}`, language: "en", category: "syllable-words", level: 3, order: index + 1, type: "word", items, instructions: "Say each word quietly, then type it in a steady rhythm.", sourceExercise: "English Level 3 - Two Syllables", unlockTrack: englishTrack })),
  ...chunks(threeSyllables, 9).map((items, index) => itemLesson({ title: `Three-Syllable Words ${index + 1}`, slug: `en-syllables-three-${index + 1}`, language: "en", category: "syllable-words", level: 3, order: 3 + index, type: "word", items, instructions: "Break each longer word into spoken parts as you type.", sourceExercise: "English Level 3 - Three Syllables", difficulty: "medium", unlockTrack: englishTrack })),
  itemLesson({ title: "Four-Syllable Words", slug: "en-syllables-four", language: "en", category: "syllable-words", level: 3, order: 5, type: "word", items: fourSyllables, instructions: "Type each long word slowly and accurately.", sourceExercise: "English Level 3 - Four Syllables", difficulty: "medium", unlockTrack: englishTrack }),
  itemLesson({ title: "Syllable Practice", slug: "en-syllables-practice", language: "en", category: "syllable-words", level: 3, order: 6, type: "word", items: [...twoSyllables.slice(0, 4), ...threeSyllables.slice(0, 4), ...fourSyllables.slice(0, 4)], instructions: "Practice words of different lengths.", sourceExercise: "English Level 3 Practice", unlockTrack: englishTrack }),
  itemLesson({ title: "Syllable Review", slug: "en-syllables-review", language: "en", category: "syllable-words", level: 3, order: 7, type: "word", items: ["yellow", "garden", "butterfly", "computer", "education", "information", "conversation"], instructions: "Review important words from this level.", sourceExercise: "English Level 3 Review", difficulty: "medium", unlockTrack: englishTrack }),
  itemLesson({ title: "Mixed Syllable Challenge", slug: "en-syllables-challenge", language: "en", category: "syllable-words", level: 3, order: 8, type: "word", items: ["apple", "rainbow", "banana", "dinosaur", "calculator", "imagination", "cooperation", "discovery"], instructions: "Complete the mixed challenge with careful spelling.", sourceExercise: "English Level 3 Challenge", difficulty: "challenge", timeLimit: 120, unlockTrack: englishTrack }),
];

const topics = [
  { key: "shapes", title: "Shapes", words: ["Square", "Circle", "Rounded Corners", "Triangle", "Arrow Right", "Arrow Down", "Rectangle", "Oval", "Heart", "Cylinder", "Cube", "Cross", "Sun", "Moon", "Cloud", "Plus Sign", "Minus Sign", "Multiplication Sign", "Division Sign", "Rhombus", "Pentagon", "Hexagon", "Star", "Wave"], pictures: [["■", "Square"], ["●", "Circle"], ["▲", "Triangle"], ["♥", "Heart"], ["★", "Star"], ["⬡", "Hexagon"]] },
  { key: "school-things", title: "School Things", words: ["Colored Pencil", "Pencil", "Pen", "Correction Pen", "Pencil Case", "Sharpener", "Eraser", "Ruler", "Pair of Scissors", "Glue", "Desk", "Table", "Chair", "Book", "Copybook", "Whiteboard", "Marker", "Brush", "Dustbin", "School Bag"], pictures: [["✏️", "Pencil"], ["🖊️", "Pen"], ["📏", "Ruler"], ["✂️", "Pair of Scissors"], ["📘", "Book"], ["🎒", "School Bag"]] },
  { key: "colors", title: "Colors", words: ["Red", "Yellow", "Blue", "Green", "Gray", "Silver", "White", "Purple", "Orange", "Dark Red", "Light Blue", "Light Green", "Dark Blue", "Black", "Pink", "Brown"], pictures: [["🔴", "Red"], ["🟡", "Yellow"], ["🔵", "Blue"], ["🟢", "Green"], ["🟣", "Purple"], ["🟠", "Orange"]] },
];
const englishLevel4 = topics.flatMap((topic, topicIndex) => {
  const base = topicIndex * 5;
  return [
    itemLesson({ title: `${topic.title} - Learn`, slug: `en-topic-${topic.key}-learn`, language: "en", category: topic.key, level: 4, order: base + 1, type: "word", items: topic.words.slice(0, 8), instructions: `Learn the first ${topic.title.toLowerCase()} words.`, sourceExercise: `English Level 4 ${topic.title} Learn`, unlockTrack: englishTrack }),
    itemLesson({ title: `${topic.title} - Practice`, slug: `en-topic-${topic.key}-practice`, language: "en", category: topic.key, level: 4, order: base + 2, type: "word", items: topic.words.slice(8, 16), instructions: `Practice more ${topic.title.toLowerCase()} words.`, sourceExercise: `English Level 4 ${topic.title} Practice`, unlockTrack: englishTrack }),
    lesson({ title: `${topic.title} - Picture Typing`, slug: `en-topic-${topic.key}-pictures`, language: "en", category: topic.key, level: 4, order: base + 3, type: "word", blocks: topic.pictures.map(([image, answer]) => ({ kind: "picture", image, answer })), instructions: "Look at each picture or symbol and type its name.", sourceExercise: `English Level 4 ${topic.title} Picture Typing`, unlockTrack: englishTrack }),
    itemLesson({ title: `${topic.title} - Review`, slug: `en-topic-${topic.key}-review`, language: "en", category: topic.key, level: 4, order: base + 4, type: "word", items: topic.words.filter((_, index) => index % 2 === 0).slice(0, 12), instructions: `Review the ${topic.title.toLowerCase()} vocabulary.`, sourceExercise: `English Level 4 ${topic.title} Review`, difficulty: "medium", unlockTrack: englishTrack }),
    itemLesson({ title: `${topic.title} - Challenge`, slug: `en-topic-${topic.key}-challenge`, language: "en", category: topic.key, level: 4, order: base + 5, type: "word", items: topic.words.filter((_, index) => index % 2 === 1).slice(0, 12), instructions: `Complete the mixed ${topic.title.toLowerCase()} challenge.`, sourceExercise: `English Level 4 ${topic.title} Challenge`, difficulty: "challenge", timeLimit: 120, unlockTrack: englishTrack }),
  ];
});

const sentenceTopics = [
  ["My School", ["I love my school.", "My school is clean and beautiful.", "We learn new things every day.", "My teachers help me learn.", "I keep my school tidy."]],
  ["My Classroom", ["My classroom is bright.", "The desks are in neat rows.", "We write on the whiteboard.", "My classmates listen carefully.", "We put our books away."]],
  ["My Friend", ["My best friend is kind.", "We read books together.", "My friend helps me at school.", "We share our pencils.", "Good friends tell the truth."]],
  ["My Family", ["I love my family.", "We eat dinner together.", "My family helps one another.", "We keep our home clean.", "I listen to my parents."]],
  ["My Mom", ["My mother is very kind.", "She helps me get ready for school.", "My mom reads with me.", "I help her at home.", "I say thank you to my mom."]],
  ["Park", ["I like going to the park.", "The park has green trees.", "Children play on the grass.", "We put rubbish in the bin.", "The fresh air feels good."]],
  ["Animals", ["A monkey can climb a tree.", "The rabbit has soft fur.", "Birds build nests.", "Fish swim in clean water.", "We must be kind to animals."]],
  ["School Things", ["I have a blue pencil.", "My ruler is on the desk.", "The scissors are in the pencil case.", "I write in my copybook.", "I carry my school bag."]],
  ["Colors", ["The sun is yellow.", "The leaves are green.", "My pen is blue.", "The flower is pink.", "I can name many colors."]],
  ["Daily Life", ["I wake up in the morning.", "I brush my teeth every day.", "I go to school on time.", "I finish my homework.", "I sleep early at night."]],
];
const englishLevel5 = [
  ...sentenceTopics.map(([title, items], index) => sentenceLesson({ title, slug: `en-sentences-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`, language: "en", category: "sentences", level: 5, order: index + 1, items, instructions: "Type each sentence with correct capitals, spaces, and punctuation.", sourceExercise: `English Level 5 - ${title}`, unlockTrack: englishTrack })),
  sentenceLesson({ title: "Sentence Review", slug: "en-sentences-review", language: "en", category: "sentences", level: 5, order: 11, items: sentenceTopics.map(([, items]) => items[0]), instructions: "Review one sentence from every topic.", sourceExercise: "English Level 5 Review", difficulty: "medium", unlockTrack: englishTrack }),
  sentenceLesson({ title: "Sentence Challenge", slug: "en-sentences-challenge", language: "en", category: "sentences", level: 5, order: 12, items: ["My classroom is clean, bright, and ready for learning.", "Can you name the red, yellow, blue, and green objects?", "My best friend and I finish our homework before we play.", "We respect our teachers, classmates, family, and school."], instructions: "Type the longer mixed sentences accurately.", sourceExercise: "English Level 5 Challenge", difficulty: "challenge", timeLimit: 180, unlockTrack: englishTrack }),
];

const paragraphTopics = [
  ["Park", ["I like going to the park.", "The park has tall trees and green grass.", "Children play while families walk together.", "We keep the park clean by using the dustbins.", "A clean park is safe and beautiful.", "I feel happy when I visit the park."]],
  ["My School", ["I love my school.", "It is a friendly place where I learn every day.", "My teachers explain lessons and help me improve.", "I study English, Khmer, mathematics, and computer skills.", "I respect the people and things at school.", "I am proud to be a good student."]],
  ["My Classroom", ["My classroom is bright and clean.", "There are desks, chairs, books, and a whiteboard.", "We listen when our teacher speaks.", "We raise our hands and take turns.", "Everyone helps to keep the room tidy.", "Our classroom is a good place to learn."]],
  ["A Monkey", ["A monkey is an active animal.", "It can climb trees and use its hands well.", "Many monkeys live in forests and eat fruit.", "A young monkey stays close to its family.", "We should watch wild animals from a safe distance.", "Animals need clean and protected homes."]],
  ["My Best Friend", ["My best friend is kind and helpful.", "We learn and play together at school.", "We share our things and speak politely.", "A good friend listens and tells the truth.", "We help each other when work is difficult.", "I try to be a good friend too."]],
  ["My Mom", ["My mom cares for our family.", "She teaches me to be kind and responsible.", "We read, talk, and do small jobs together.", "I help by putting my things away.", "I listen when she gives good advice.", "I am thankful for my mom."]],
  ["My Family", ["My family is important to me.", "We care for one another and share our work.", "We eat together and talk about our day.", "Everyone has a job to help at home.", "We solve problems calmly and respectfully.", "Love makes our family strong."]],
  ["School Trip", ["Our class went on a school trip.", "We prepared our bags and listened to the safety rules.", "The teacher showed us many interesting places.", "We asked questions and wrote notes.", "Everyone stayed with the group.", "The trip helped us learn outside the classroom."]],
  ["Plant Life Cycle", ["A plant begins as a seed.", "Water and warmth help the seed open.", "A small root grows down into the soil.", "A shoot grows up toward the light.", "Leaves help the plant make food.", "A healthy plant can produce flowers and new seeds."]],
  ["Farmers", ["Farmers work hard to grow food.", "They prepare the soil and plant seeds.", "Crops need water, sunlight, and care.", "Farmers watch for weeds and insects.", "They harvest crops when the food is ready.", "We should respect farmers and avoid wasting food."]],
];
const englishLevel6 = [
  ...paragraphTopics.flatMap(([title, sentences], topicIndex) => {
    const base = topicIndex * 3;
    const key = title.toLowerCase().replace(/[^a-z]+/g, "-");
    return [
      paragraphLesson({ title: `${title} - Easy`, slug: `en-paragraph-${key}-easy`, language: "en", category: "paragraphs", level: 6, order: base + 1, text: sentences.slice(0, 4).join(" "), instructions: "Read once, then type the four sentences accurately at a relaxed pace.", sourceExercise: `English Level 6 ${title} Easy - adapted topic`, contentStatus: "custom", unlockTrack: englishTrack }),
      paragraphLesson({ title: `${title} - Medium`, slug: `en-paragraph-${key}-medium`, language: "en", category: "paragraphs", level: 6, order: base + 2, text: sentences.join(" "), instructions: "Type the complete paragraph with steady rhythm and clean punctuation.", sourceExercise: `English Level 6 ${title} Medium - adapted topic`, contentStatus: "custom", difficulty: "medium", unlockTrack: englishTrack }),
      paragraphLesson({ title: `${title} - Challenge`, slug: `en-paragraph-${key}-challenge`, language: "en", category: "paragraphs", level: 6, order: base + 3, text: "Authorized source wording is awaiting review before publication.", instructions: "This exact source challenge must be reviewed before publication.", sourceExercise: `English Level 6 ${title} Challenge`, sourceBook: pendingBook, contentStatus: "needs_review", difficulty: "challenge", unlockTrack: englishTrack }),
    ];
  }),
  paragraphLesson({ title: "Paragraph Practice", slug: "en-paragraph-practice", language: "en", category: "paragraphs", level: 6, order: 31, text: "I read the paragraph first. I keep my hands relaxed and type one sentence at a time. I check spaces, capital letters, and punctuation. Accuracy helps my speed grow.", instructions: "Practice a complete paragraph using all good typing habits.", sourceExercise: "English Level 6 Practice", contentStatus: "custom", unlockTrack: englishTrack }),
  paragraphLesson({ title: "Paragraph Review", slug: "en-paragraph-review", language: "en", category: "paragraphs", level: 6, order: 32, text: "My school and family help me learn. Farmers grow food, plants grow from seeds, and animals need safe homes. I type carefully and use my computer responsibly.", instructions: "Review the main paragraph themes.", sourceExercise: "English Level 6 Review", contentStatus: "custom", difficulty: "medium", unlockTrack: englishTrack }),
];

const englishLevel7 = [
  lesson({ title: "The Lion and the Mouse", slug: "en-story-lion-mouse", language: "en", category: "stories", level: 7, order: 1, type: "story", blocks: [{ kind: "story", text: "A lion was sleeping when a little mouse ran over his paw. The lion caught the mouse, but the mouse asked to be set free. Later, the lion was trapped in a net. The mouse heard him, chewed the ropes, and helped him escape. The lion learned that even a small friend can give great help.", question: "How did the mouse help the lion?", options: ["It chewed the ropes.", "It carried the lion.", "It found food."], answer: "It chewed the ropes." }], instructions: "Read the story, type it, and answer the question.", sourceExercise: "English Level 7 - The Lion and the Mouse (public-domain adaptation)", contentStatus: "custom", unlockTrack: englishTrack }),
  lesson({ title: "The Rainbow Fish", slug: "en-story-rainbow-fish", language: "en", category: "stories", level: 7, order: 2, type: "story", blocks: [{ kind: "story", text: "Authorized source text is awaiting review before publication.", question: "Source review required", options: ["Review required"], answer: "Review required" }], instructions: "An administrator must verify the authorized source text before publishing.", sourceExercise: "English Level 7 - The Rainbow Fish", sourceBook: pendingBook, contentStatus: "needs_review", unlockTrack: englishTrack }),
  lesson({ title: "School Trip", slug: "en-story-school-trip", language: "en", category: "stories", level: 7, order: 3, type: "story", blocks: [{ kind: "story", text: "Dara's class visited a science garden. Before leaving school, the teacher reviewed the safety rules. At the garden, students observed plants, insects, and a small pond. They drew pictures and wrote new words in their notebooks. On the way home, Dara shared his notes with a friend and thanked the teacher for the trip.", question: "What did the students do at the garden?", options: ["They observed and took notes.", "They watched a movie.", "They stayed on the bus."], answer: "They observed and took notes." }], instructions: "Read, type, and answer the comprehension question.", sourceExercise: "English Level 7 - School Trip adaptation", contentStatus: "custom", unlockTrack: englishTrack }),
  paragraphLesson({ title: "Story Practice", slug: "en-story-practice", language: "en", category: "stories", level: 7, order: 4, text: "A short story has characters, a place, and events. I read the whole story before I type. Then I type one idea at a time and check the punctuation.", instructions: "Practice the habits used for story typing.", sourceExercise: "English Level 7 Practice", contentStatus: "custom", unlockTrack: englishTrack }),
  paragraphLesson({ title: "Story Review", slug: "en-story-review", language: "en", category: "stories", level: 7, order: 5, text: "Good readers look for the main idea. Good typists keep a steady rhythm. After typing, I answer the question using evidence from the story.", instructions: "Review reading and typing skills.", sourceExercise: "English Level 7 Review", contentStatus: "custom", difficulty: "medium", unlockTrack: englishTrack }),
  paragraphLesson({ title: "Story Challenge", slug: "en-story-challenge", language: "en", category: "stories", level: 7, order: 6, text: "A young student found a library book under a desk. Instead of keeping it, she read the name inside and returned it to its owner. The owner was relieved and thanked her. The student felt proud because honesty had solved the problem.", instructions: "Type the story and think about its lesson.", sourceExercise: "English Level 7 Challenge", contentStatus: "custom", difficulty: "challenge", timeLimit: 240, unlockTrack: englishTrack }),
];

const khmerGroups = [
  ["ក ខ គ ឃ ង", ["ក", "ខ", "គ", "ឃ", "ង"]], ["ច ឆ ជ ឈ ញ", ["ច", "ឆ", "ជ", "ឈ", "ញ"]], ["ដ ឋ ឌ ឍ ណ", ["ដ", "ឋ", "ឌ", "ឍ", "ណ"]], ["ត ថ ទ ធ ន", ["ត", "ថ", "ទ", "ធ", "ន"]], ["ប ផ ព ភ ម", ["ប", "ផ", "ព", "ភ", "ម"]], ["យ រ ល វ", ["យ", "រ", "ល", "វ"]], ["ស ហ ឡ អ", ["ស", "ហ", "ឡ", "អ"]],
];
const allKhmerConsonants = khmerGroups.flatMap(([, items]) => items);
const khmerLevel1 = [
  ...khmerGroups.map(([title, items], index) => itemLesson({ title, titleKhmer: title, slug: `km-consonants-${String(index + 1).padStart(2, "0")}`, language: "km", category: "khmer-consonants", level: 1, order: index + 1, type: "letter", items, instructions: "វាយព្យញ្ជនៈនីមួយៗដោយប្រុងប្រយ័ត្ន។", sourceExercise: `Khmer Level 1 - Group ${index + 1}`, difficulty: "beginner", unlockTrack: khmerTrack })),
  itemLesson({ title: "Single Character Practice", titleKhmer: "ហាត់វាយតួអក្សរមួយៗ", slug: "km-consonants-single-practice", language: "km", category: "khmer-consonants", level: 1, order: 8, type: "letter", items: ["ក ក ក ក ក", "ខ ខ ខ ខ ខ", "គ គ គ គ គ", "ច ច ច ច ច", "ត ត ត ត ត"], instructions: "វាយតួអក្សរដដែលៗឱ្យបានត្រឹមត្រូវ។", sourceExercise: "Khmer Level 1 Single Character Practice", unlockTrack: khmerTrack }),
  itemLesson({ title: "Mixed Practice", titleKhmer: "ហាត់វាយចម្រុះ", slug: "km-consonants-mixed-practice", language: "km", category: "khmer-consonants", level: 1, order: 9, type: "letter", items: ["ក ខ ក ខ", "ច ឆ ច ឆ", "ត ថ ត ថ", "ប ផ ប ផ", "ស ហ ស ហ"], instructions: "វាយព្យញ្ជនៈឆ្លាស់គ្នា។", sourceExercise: "Khmer Level 1 Mixed Practice", unlockTrack: khmerTrack }),
  itemLesson({ title: "Consonant Review", titleKhmer: "ពិនិត្យព្យញ្ជនៈឡើងវិញ", slug: "km-consonants-review", language: "km", category: "khmer-consonants", level: 1, order: 10, type: "letter", items: khmerGroups.map(([title]) => title), instructions: "ពិនិត្យព្យញ្ជនៈគ្រប់ក្រុមឡើងវិញ។", sourceExercise: "Khmer Level 1 Review", difficulty: "medium", unlockTrack: khmerTrack }),
  itemLesson({ title: "Consonant Speed Challenge", titleKhmer: "ការប្រកួតល្បឿនព្យញ្ជនៈ", slug: "km-consonants-speed-challenge", language: "km", category: "khmer-consonants", level: 1, order: 11, type: "letter", items: allKhmerConsonants, instructions: "វាយព្យញ្ជនៈទាំងអស់ដោយរក្សាភាពត្រឹមត្រូវ។", sourceExercise: "Khmer Level 1 Speed Challenge", difficulty: "challenge", timeLimit: 120, unlockTrack: khmerTrack }),
];

const khmerVowels = ["", "ា", "ិ", "ី", "ឹ", "ឺ", "ុ", "ូ", "ួ", "ើ", "ឿ", "ៀ"];
const khmerCombinationGroups = chunks(allKhmerConsonants, 3);
const khmerLevel2 = [
  ...khmerCombinationGroups.map((consonants, index) => itemLesson({
    title: `Consonant and Vowel Group ${index + 1}`,
    titleKhmer: `ព្យញ្ជនៈ និងស្រៈ ក្រុមទី ${index + 1}`,
    slug: `km-combinations-group-${String(index + 1).padStart(2, "0")}`,
    language: "km",
    category: "khmer-combinations",
    level: 2,
    order: index + 1,
    type: "word",
    items: consonants.flatMap((consonant) => khmerVowels.map((vowel) => `${consonant}${vowel}`)),
    instructions: "វាយព្យញ្ជនៈផ្សំជាមួយស្រៈម្តងមួយក្រុម។",
    sourceExercise: `Khmer Level 2 - Group ${index + 1}`,
    difficulty: index < 4 ? "beginner" : "easy",
    unlockTrack: khmerTrack,
  })),
  itemLesson({ title: "Combination Practice", titleKhmer: "ហាត់ផ្សំព្យញ្ជនៈ និងស្រៈ", slug: "km-combinations-practice", language: "km", category: "khmer-combinations", level: 2, order: 12, type: "word", items: ["ក កា កិ កី", "ខ ខា ខិ ខី", "គ គា គិ គី", "ច ចា ចិ ចី"], instructions: "ហាត់វាយទម្រង់ដែលបានរៀន។", sourceExercise: "Khmer Level 2 Practice", unlockTrack: khmerTrack }),
  itemLesson({ title: "Combination Review", titleKhmer: "ពិនិត្យការផ្សំឡើងវិញ", slug: "km-combinations-review", language: "km", category: "khmer-combinations", level: 2, order: 13, type: "word", items: allKhmerConsonants.map((consonant, index) => `${consonant}${khmerVowels[(index % (khmerVowels.length - 1)) + 1]}`), instructions: "ពិនិត្យព្យញ្ជនៈ និងស្រៈឡើងវិញ។", sourceExercise: "Khmer Level 2 Review", difficulty: "medium", unlockTrack: khmerTrack }),
  itemLesson({ title: "Combination Challenge", titleKhmer: "ការប្រកួតវាយពាក្យផ្សំ", slug: "km-combinations-challenge", language: "km", category: "khmer-combinations", level: 2, order: 14, type: "word", items: ["កា", "ខិ", "គី", "ឃុ", "ងូ", "ចួ", "ជើ", "ឈឿ", "ញៀ", "ដា", "តី", "បូ", "មួ", "សើ", "អៀ"], instructions: "វាយទម្រង់ចម្រុះឱ្យបានត្រឹមត្រូវ។", sourceExercise: "Khmer Level 2 Challenge", difficulty: "challenge", timeLimit: 120, unlockTrack: khmerTrack }),
];

const khmerWordTopics = [
  ["School Words", "ពាក្យអំពីសាលា", ["សាលា", "សៀវភៅ", "គ្រូ", "សិស្ស", "ថ្នាក់រៀន", "កុមារ"]],
  ["Family Words", "ពាក្យអំពីគ្រួសារ", ["ផ្ទះ", "ឪពុក", "ម្តាយ", "មិត្តភក្តិ"]],
  ["Nature Words", "ពាក្យអំពីធម្មជាតិ", ["ទឹក", "ដី", "ដើមឈើ", "ផ្កា", "សត្វ"]],
  ["Daily Words", "ពាក្យប្រើប្រចាំថ្ងៃ", ["ការងារ", "ភាសា", "អាហារ", "នាឡិកា"]],
  ["Learning Words", "ពាក្យអំពីការសិក្សា", ["អាន", "សរសេរ", "រៀន", "កុំព្យូទ័រ", "ចំណេះដឹង"]],
  ["Good Habit Words", "ពាក្យអំពីទម្លាប់ល្អ", ["អនាម័យ", "សុភាព", "ឧស្សាហ៍", "ស្មោះត្រង់", "ជួយគ្នា"]],
];
const allKhmerWords = khmerWordTopics.flatMap(([, , items]) => items);
const khmerLevel3 = [
  ...khmerWordTopics.map(([title, titleKhmer, items], index) => itemLesson({ title, titleKhmer, slug: `km-words-topic-${index + 1}`, language: "km", category: "khmer-words", level: 3, order: index + 1, type: "word", items, instructions: "អានពាក្យ រួចវាយឱ្យបានត្រឹមត្រូវ។", sourceExercise: `Khmer Level 3 Topic ${index + 1}`, unlockTrack: khmerTrack })),
  itemLesson({ title: "Word Practice", titleKhmer: "ហាត់វាយពាក្យ", slug: "km-words-practice", language: "km", category: "khmer-words", level: 3, order: 7, type: "word", items: allKhmerWords.filter((_, index) => index % 2 === 0), instructions: "ហាត់វាយពាក្យតាមប្រធានបទចម្រុះ។", sourceExercise: "Khmer Level 3 Practice", unlockTrack: khmerTrack }),
  itemLesson({ title: "Word Review", titleKhmer: "ពិនិត្យពាក្យឡើងវិញ", slug: "km-words-review", language: "km", category: "khmer-words", level: 3, order: 8, type: "word", items: allKhmerWords.filter((_, index) => index % 2 === 1), instructions: "ពិនិត្យពាក្យដែលបានរៀនឡើងវិញ។", sourceExercise: "Khmer Level 3 Review", difficulty: "medium", unlockTrack: khmerTrack }),
  itemLesson({ title: "Word Challenge", titleKhmer: "ការប្រកួតវាយពាក្យ", slug: "km-words-challenge", language: "km", category: "khmer-words", level: 3, order: 9, type: "word", items: ["សាលា", "មិត្តភក្តិ", "ថ្នាក់រៀន", "ចំណេះដឹង", "ស្មោះត្រង់", "កុំព្យូទ័រ", "អនាម័យ"], instructions: "វាយពាក្យវែង និងពាក្យចម្រុះ។", sourceExercise: "Khmer Level 3 Challenge", difficulty: "challenge", timeLimit: 150, unlockTrack: khmerTrack }),
];

const khmerSentenceTopics = [
  ["Easy Sentences", "ប្រយោគងាយៗ", ["ខ្ញុំជាសិស្ស។", "ខ្ញុំទៅសាលារៀន។", "ខ្ញុំផឹកទឹកស្អាត។", "ខ្ញុំអានសៀវភៅរាល់ថ្ងៃ។", "ខ្ញុំស្រឡាញ់ការសិក្សា។", "ខ្ញុំសរសេរឈ្មោះរបស់ខ្ញុំ។", "ខ្ញុំរៀនវាយអក្សរខ្មែរ។", "ខ្ញុំអង្គុយឱ្យបានត្រឹមត្រូវ។", "ខ្ញុំវាយម្តងមួយពាក្យ។", "ខ្ញុំហាត់វាយដោយមិនប្រញាប់។"]],
  ["School Sentences", "ប្រយោគអំពីសាលា", ["ខ្ញុំស្រឡាញ់សាលារបស់ខ្ញុំ។", "អ្នកគ្រូរបស់ខ្ញុំចិត្តល្អ។", "ថ្នាក់រៀនរបស់ខ្ញុំស្អាត។", "យើងរៀនភាសាខ្មែរ។", "សិស្សស្តាប់អ្នកគ្រូ។", "យើងអានសៀវភៅក្នុងថ្នាក់។", "មិត្តភក្តិរបស់ខ្ញុំខិតខំរៀន។", "ខ្ញុំរៀបចំសម្ភារៈសិក្សា។", "យើងរក្សាបន្ទប់រៀនឱ្យស្អាត។", "ខ្ញុំមកសាលាឱ្យបានទាន់ពេល។"]],
  ["Family Sentences", "ប្រយោគអំពីគ្រួសារ", ["ខ្ញុំស្រឡាញ់គ្រួសាររបស់ខ្ញុំ។", "ឪពុករបស់ខ្ញុំធ្វើការ។", "ម្តាយរបស់ខ្ញុំចិត្តល្អ។", "ខ្ញុំជួយការងារនៅផ្ទះ។", "គ្រួសារខ្ញុំជួយគ្នា។", "ឪពុកម្តាយថែរក្សាខ្ញុំ។", "យើងញ៉ាំអាហារជុំគ្នា។", "ខ្ញុំគោរពអ្នកចាស់ទុំ។", "យើងនិយាយគ្នាដោយសុភាព។", "ផ្ទះរបស់ខ្ញុំមានសុភមង្គល។"]],
  ["Daily Life", "ជីវិតប្រចាំថ្ងៃ", ["ខ្ញុំក្រោកពីព្រឹក។", "ខ្ញុំដុសធ្មេញរាល់ថ្ងៃ។", "ខ្ញុំទៅសាលាទាន់ពេល។", "ខ្ញុំធ្វើកិច្ចការផ្ទះ។", "ខ្ញុំចូលគេងពីព្រលប់។", "ខ្ញុំលាងមុខនៅពេលព្រឹក។", "ខ្ញុំញ៉ាំអាហារពេលព្រឹក។", "ខ្ញុំរៀបចំកាបូបទៅសាលា។", "ខ្ញុំអានសៀវភៅនៅពេលល្ងាច។", "ខ្ញុំរៀបចំសម្លៀកបំពាក់សម្រាប់ថ្ងៃស្អែក។"]],
  ["Good Habits", "ទម្លាប់ល្អ", ["ខ្ញុំរក្សាអនាម័យ។", "ខ្ញុំនិយាយដោយសុភាព។", "ខ្ញុំជួយមិត្តភក្តិរបស់ខ្ញុំ។", "ខ្ញុំទុកដាក់សម្ភារៈឱ្យមានរបៀប។", "ខ្ញុំគោរពច្បាប់សាលា។", "ខ្ញុំលាងដៃមុនពេលញ៉ាំអាហារ។", "ខ្ញុំចោលសំរាមក្នុងធុងសំរាម។", "ខ្ញុំស្តាប់ពេលអ្នកដទៃនិយាយ។", "ខ្ញុំទទួលស្គាល់កំហុសរបស់ខ្ញុំ។", "ខ្ញុំខិតខំកែលម្អខ្លួនជារៀងរាល់ថ្ងៃ។"]],
  ["Sentence Review", "ពិនិត្យប្រយោគឡើងវិញ", ["ខ្ញុំអាន សរសេរ និងវាយអក្សររាល់ថ្ងៃ។", "សិស្សល្អគោរពអ្នកគ្រូ និងជួយមិត្តភក្តិ។", "យើងរក្សាផ្ទះ និងសាលាឱ្យស្អាត។", "ខ្ញុំប្រើកុំព្យូទ័រដោយប្រុងប្រយ័ត្ន។", "ការខិតខំរៀននាំឱ្យមានចំណេះដឹង។", "ខ្ញុំអង្គុយត្រង់ និងដាក់ម្រាមដៃលើក្ដារចុច។", "ខ្ញុំមើលអត្ថបទ ហើយវាយដោយចង្វាក់ថេរ។", "ខ្ញុំផ្តោតលើភាពត្រឹមត្រូវមុនល្បឿន។", "ការហាត់ជាប្រចាំជួយឱ្យខ្ញុំវាយបានលឿន។"]],
];
const khmerLevel4 = [
  ...khmerSentenceTopics.map(([title, titleKhmer, items], index) => sentenceLesson({ title, titleKhmer, slug: `km-sentences-${index + 1}`, language: "km", category: "khmer-sentences", level: 4, order: index + 1, items, instructions: "វាយប្រយោគដោយប្រើចន្លោះ និងសញ្ញាខណ្ឌឱ្យត្រឹមត្រូវ។", sourceExercise: `Khmer Level 4 ${title}`, difficulty: index === 5 ? "medium" : "easy", unlockTrack: khmerTrack })),
  sentenceLesson({ title: "Sentence Challenge", titleKhmer: "ការប្រកួតវាយប្រយោគ", slug: "km-sentences-challenge", language: "km", category: "khmer-sentences", level: 4, order: 7, items: ["ខ្ញុំខិតខំរៀន អានសៀវភៅ និងធ្វើកិច្ចការផ្ទះឱ្យបានទាន់ពេល។", "សិស្សល្អរក្សាអនាម័យ គោរពអ្នកគ្រូ និងជួយមិត្តភក្តិ។", "យើងប្រើកុំព្យូទ័រដើម្បីរៀន និងស្វែងរកចំណេះដឹងថ្មីៗ។", "ខ្ញុំអង្គុយឱ្យត្រង់ ដាក់ម្រាមដៃត្រឹមត្រូវ និងវាយដោយមិនប្រញាប់ពេក។", "នៅពេលវាយខុស ខ្ញុំកែតម្រូវ ហើយបន្តវាយដោយស្ងប់ស្ងាត់។", "ការហាត់រាល់ថ្ងៃជួយឱ្យខ្ញុំវាយបានលឿន ត្រឹមត្រូវ និងមានទំនុកចិត្ត។"], instructions: "វាយប្រយោគវែងៗដោយរក្សាភាពត្រឹមត្រូវ និងចង្វាក់ថេរ។", sourceExercise: "Khmer Level 4 Challenge", difficulty: "challenge", timeLimit: 180, unlockTrack: khmerTrack }),
];

const khmerParagraphThemes = [
  ["My Teacher", "អ្នកគ្រូខ្ញុំ", ["អ្នកគ្រូខ្ញុំចិត្តល្អ។", "អ្នកគ្រូបង្រៀនខ្ញុំរាល់ថ្ងៃ។", "គាត់ពន្យល់មេរៀនដោយអត់ធ្មត់។", "ខ្ញុំគោរព និងស្តាប់អ្នកគ្រូ។", "អ្នកគ្រូលើកទឹកចិត្តឱ្យខ្ញុំសួរសំណួរ។", "ខ្ញុំធ្វើតាមការណែនាំរបស់អ្នកគ្រូ។", "នៅពេលខ្ញុំវាយខុស អ្នកគ្រូជួយកែតម្រូវ។", "ខ្ញុំខិតខំហាត់វាយអក្សរជារៀងរាល់ថ្ងៃ។"]],
  ["My School", "សាលារៀនខ្ញុំ", ["សាលារៀនខ្ញុំស្អាត។", "ខ្ញុំរៀនជាមួយមិត្តភក្តិ។", "អ្នកគ្រូជួយយើងឱ្យមានចំណេះដឹង។", "យើងរក្សាសាលាឱ្យមានអនាម័យ។", "ថ្នាក់រៀនមានតុ កៅអី និងក្ដារខៀន។", "សិស្សទាំងអស់អង្គុយរៀនដោយមានរបៀប។", "យើងជួយគ្នាធ្វើកិច្ចការក្នុងថ្នាក់។", "ខ្ញុំមានមោទនភាពចំពោះសាលារបស់ខ្ញុំ។"]],
  ["New School Year", "បវេសនកាល", ["ឆ្នាំសិក្សាថ្មីចាប់ផ្តើម។", "សិស្សរៀបចំសៀវភៅ និងសម្ភារៈសិក្សា។", "យើងស្គាល់អ្នកគ្រូ និងមិត្តថ្មី។", "គ្រប់គ្នាត្រៀមខ្លួនរៀនដោយរីករាយ។", "ខ្ញុំកំណត់គោលដៅរៀនឱ្យបានល្អ។", "អ្នកគ្រូណែនាំច្បាប់ថ្មីក្នុងថ្នាក់។", "យើងចែករំលែកសម្ភារៈជាមួយគ្នា។", "ខ្ញុំចង់បង្កើនល្បឿនវាយអក្សររបស់ខ្ញុំ។"]],
  ["Hygiene", "អនាម័យ", ["អនាម័យជួយឱ្យយើងមានសុខភាពល្អ។", "យើងលាងដៃមុនពេលញ៉ាំអាហារ។", "យើងដុសធ្មេញ និងងូតទឹករាល់ថ្ងៃ។", "ទីកន្លែងស្អាតធ្វើឱ្យយើងរស់នៅសុខស្រួល។", "ខ្ញុំកាត់ក្រចក និងស្លៀកពាក់ស្អាត។", "យើងគ្របមាត់ពេលក្អក ឬកណ្ដាស់។", "យើងចោលសំរាមក្នុងធុងឱ្យបានត្រឹមត្រូវ។", "ទម្លាប់ស្អាតការពារខ្លួន និងអ្នកដទៃ។"]],
  ["Hard-working Student", "សិស្សឧស្សាហ៍", ["សិស្សឧស្សាហ៍ខិតខំរៀន។", "គាត់អានសៀវភៅ និងធ្វើកិច្ចការផ្ទះ។", "ពេលមិនយល់ គាត់សួរអ្នកគ្រូ។", "ការខិតខំជួយឱ្យគាត់រីកចម្រើន។", "គាត់រៀបចំពេលវេលារៀនជាប្រចាំ។", "គាត់ផ្តោតអារម្មណ៍ពេលធ្វើកិច្ចការ។", "គាត់ពិនិត្យកំហុស និងកែតម្រូវដោយខ្លួនឯង។", "ទម្លាប់ឧស្សាហ៍នាំឱ្យទទួលបានលទ្ធផលល្អ។"]],
  ["Sugar Palm", "ដើមត្នោត", ["ដើមត្នោតជារុក្ខជាតិដែលគេស្គាល់នៅកម្ពុជា។", "វាអាចលូតលាស់បានខ្ពស់។", "ប្រជាជនប្រើប្រាស់ផ្នែកផ្សេងៗរបស់ដើមត្នោត។", "យើងគួរថែរក្សារុក្ខជាតិ និងធម្មជាតិ។", "ស្លឹកត្នោតអាចប្រើធ្វើកន្ត្រក និងដំបូល។", "ផ្លែត្នោត និងទឹកត្នោតអាចធ្វើជាអាហារ។", "ដើមត្នោតជានិមិត្តរូបមួយនៃជនបទខ្មែរ។", "ការដាំដើមឈើជួយការពារបរិស្ថាន។"]],
  ["Pchum Ben", "បុណ្យភ្ជុំបិណ្ឌ", ["បុណ្យភ្ជុំបិណ្ឌជាបុណ្យប្រពៃណីខ្មែរ។", "គ្រួសារជាច្រើនទៅវត្តជាមួយគ្នា។", "មនុស្សរៀបចំអាហារ និងធ្វើបុណ្យ។", "យើងគោរពប្រពៃណី និងអំពើល្អ។", "កូនចៅទៅសួរសុខទុក្ខឪពុកម្តាយ និងជីដូនជីតា។", "មនុស្សស្តាប់ធម៌ និងចែករំលែកអាហារ។", "ពិធីបុណ្យរំលឹកឱ្យយើងដឹងគុណបុព្វបុរស។", "កុមារគួរចូលរួមដោយសុភាព និងគោរព។"]],
];
const khmerLevel5 = [
  ...khmerParagraphThemes.flatMap(([title, titleKhmer, sentences], topicIndex) => {
    const base = topicIndex * 3;
    return [
      paragraphLesson({ title: `${title} - Beginner`, titleKhmer: `${titleKhmer} - កម្រិតដំបូង`, slug: `km-paragraph-${topicIndex + 1}-beginner`, language: "km", category: "khmer-paragraphs", level: 5, order: base + 1, text: sentences.slice(0, 7).join(" "), instructions: "អានម្តង រួចវាយប្រយោគទាំងប្រាំពីរដោយផ្តោតលើភាពត្រឹមត្រូវ។", sourceExercise: `Khmer Level 5 ${titleKhmer} Beginner - custom adaptation`, contentStatus: "custom", unlockTrack: khmerTrack }),
      paragraphLesson({ title: `${title} - Intermediate`, titleKhmer: `${titleKhmer} - កម្រិតមធ្យម`, slug: `km-paragraph-${topicIndex + 1}-intermediate`, language: "km", category: "khmer-paragraphs", level: 5, order: base + 2, text: sentences.join(" "), instructions: "វាយកថាខណ្ឌទាំងមូលដោយរក្សាចង្វាក់ថេរ និងសញ្ញាខណ្ឌត្រឹមត្រូវ។", sourceExercise: `Khmer Level 5 ${titleKhmer} Intermediate - custom adaptation`, contentStatus: "custom", difficulty: "medium", unlockTrack: khmerTrack }),
      paragraphLesson({ title: `${title} - Challenge`, titleKhmer: `${titleKhmer} - កម្រិតប្រកួត`, slug: `km-paragraph-${topicIndex + 1}-challenge`, language: "km", category: "khmer-paragraphs", level: 5, order: base + 3, text: "អត្ថបទប្រភពកំពុងរង់ចាំការពិនិត្យដោយអ្នកគ្រប់គ្រង។", instructions: "ត្រូវពិនិត្យអត្ថបទដើមមុនពេលបោះពុម្ពមេរៀននេះ។", sourceExercise: `Khmer Level 5 ${titleKhmer} Challenge`, sourceBook: pendingBook, contentStatus: "needs_review", difficulty: "challenge", unlockTrack: khmerTrack }),
    ];
  }),
  paragraphLesson({ title: "Paragraph Practice", titleKhmer: "ហាត់វាយកថាខណ្ឌ", slug: "km-paragraph-practice", language: "km", category: "khmer-paragraphs", level: 5, order: 22, text: "ខ្ញុំអានកថាខណ្ឌជាមុន។ បន្ទាប់មក ខ្ញុំវាយម្តងមួយប្រយោគ។ ខ្ញុំរក្សាដៃឱ្យស្រាល និងអង្គុយឱ្យត្រង់។ ខ្ញុំមើលពាក្យបន្ទាប់មុនពេលចុចគ្រាប់ចុច។ ខ្ញុំប្រើចន្លោះ និងសញ្ញាខណ្ឌឱ្យបានត្រឹមត្រូវ។ ពេលវាយខុស ខ្ញុំកែតម្រូវ ហើយបន្តដោយស្ងប់ស្ងាត់។ ខ្ញុំផ្តោតលើភាពត្រឹមត្រូវ មុនពេលបង្កើនល្បឿន។ ការហាត់ជាប្រចាំធ្វើឱ្យខ្ញុំមានទំនុកចិត្ត។", instructions: "ហាត់អានជាមុន រក្សាទម្រង់អង្គុយល្អ និងវាយដោយចង្វាក់ថេរ។", sourceExercise: "Khmer Level 5 Practice", contentStatus: "custom", unlockTrack: khmerTrack }),
  paragraphLesson({ title: "Paragraph Review", titleKhmer: "ពិនិត្យកថាខណ្ឌឡើងវិញ", slug: "km-paragraph-review", language: "km", category: "khmer-paragraphs", level: 5, order: 23, text: "សិស្សឧស្សាហ៍ខិតខំរៀន និងរក្សាអនាម័យ។ គាត់គោរពអ្នកគ្រូ ជួយមិត្តភក្តិ និងថែរក្សាសាលារៀនឱ្យស្អាត។ គាត់រៀបចំពេលវេលា និងធ្វើកិច្ចការឱ្យបានទាន់ពេល។ នៅពេលហាត់វាយ គាត់អង្គុយត្រង់ និងដាក់ម្រាមដៃត្រឹមត្រូវ។ គាត់វាយដោយចង្វាក់ថេរ ហើយពិនិត្យកំហុសរបស់ខ្លួន។ ទម្លាប់ល្អជួយឱ្យគាត់រៀន និងវាយអក្សរបានកាន់តែល្អ។", instructions: "ពិនិត្យជំនាញអាន វាយអក្សរ និងទម្លាប់ល្អឡើងវិញ។", sourceExercise: "Khmer Level 5 Review", contentStatus: "custom", difficulty: "medium", unlockTrack: khmerTrack }),
];

const advancedKhmerTitles = ["អនាម័យ", "សិស្សឧស្សាហ៍", "ដើមត្នោត", "បុណ្យភ្ជុំបិណ្ឌ", "សម្ដេចព្រះសង្ឃរាជ ជួន ណាត", "កល្យាណមិត្ត", "ធនធានជលផល"];
const khmerLevel6 = [
  ...advancedKhmerTitles.map((titleKhmer, index) => paragraphLesson({ title: `Advanced Reading ${index + 1}`, titleKhmer, slug: `km-advanced-reading-${index + 1}`, language: "km", category: "khmer-advanced", level: 6, order: index + 1, text: "អត្ថបទប្រភពកំពុងរង់ចាំការពិនិត្យយូនីកូដ និងការអនុម័តពីអ្នកគ្រប់គ្រង។", instructions: "មេរៀននេះមិនទាន់បោះពុម្ពទេ ព្រោះត្រូវពិនិត្យអត្ថបទដើម។", sourceExercise: `Khmer Level 6 - ${titleKhmer}`, sourceBook: pendingBook, contentStatus: "needs_review", difficulty: "advanced", unlockTrack: khmerTrack })),
  paragraphLesson({ title: "Advanced Practice", titleKhmer: "ហាត់វាយអត្ថបទ", slug: "km-advanced-practice", language: "km", category: "khmer-advanced", level: 6, order: 8, text: "ការអាន និងការវាយអក្សរជួយបង្កើនចំណេះដឹង។ សិស្សអានអត្ថបទទាំងមូល ដើម្បីយល់ពីគំនិតសំខាន់។ បន្ទាប់មក គាត់វាយម្តងមួយប្រយោគដោយរក្សាចង្វាក់ថេរ។ គាត់មើលពាក្យពីរឬបីនៅខាងមុខ មុនពេលផ្លាស់ទីម្រាមដៃ។ ពេលវាយចប់ គាត់ពិនិត្យចន្លោះ សញ្ញាខណ្ឌ និងពាក្យដែលពិបាក។ ការអនុវត្តជាប្រចាំជួយបង្កើនល្បឿនដោយមិនបាត់បង់ភាពត្រឹមត្រូវ។", instructions: "ហាត់វាយអត្ថបទវែងដោយអានជាមុន និងរក្សាចង្វាក់ថេរ។", sourceExercise: "Khmer Level 6 Practice", contentStatus: "custom", unlockTrack: khmerTrack }),
  paragraphLesson({ title: "Advanced Review", titleKhmer: "ពិនិត្យអត្ថបទឡើងវិញ", slug: "km-advanced-review", language: "km", category: "khmer-advanced", level: 6, order: 9, text: "យើងគួរខិតខំរៀន ថែរក្សាអនាម័យ គោរពប្រពៃណី និងការពារធនធានធម្មជាតិ។ សិស្សល្អចេះរៀបចំពេលវេលា ស្តាប់អ្នកដទៃ និងទទួលខុសត្រូវលើការងាររបស់ខ្លួន។ នៅពេលប្រើកុំព្យូទ័រ យើងអង្គុយឱ្យត្រង់ និងសម្រាកភ្នែកជាប្រចាំ។ យើងផ្តោតលើភាពត្រឹមត្រូវ ហើយបង្កើនល្បឿនបន្តិចម្តងៗ។ ទម្លាប់ល្អជួយឱ្យយើងក្លាយជាសិស្ស និងពលរដ្ឋល្អ។", instructions: "ពិនិត្យជំនាញវាយអត្ថបទ ពាក្យសំខាន់ៗ និងទម្លាប់ល្អ។", sourceExercise: "Khmer Level 6 Review", contentStatus: "custom", difficulty: "medium", unlockTrack: khmerTrack }),
  paragraphLesson({ title: "Advanced Challenge", titleKhmer: "ការប្រកួតវាយអត្ថបទ", slug: "km-advanced-challenge", language: "km", category: "khmer-advanced", level: 6, order: 10, text: "អត្ថបទប្រកួតពីសៀវភៅដើមកំពុងរង់ចាំការពិនិត្យ និងការអនុម័ត។", instructions: "ត្រូវផ្ទៀងផ្ទាត់អត្ថបទប្រភពមុនពេលបោះពុម្ព។", sourceExercise: "Khmer Level 6 Challenge", sourceBook: pendingBook, contentStatus: "needs_review", difficulty: "challenge", unlockTrack: khmerTrack }),
];

const typingTests = [
  lesson({ title: "English Typing Test", slug: "test-en-standard", language: "en", category: "typing-tests", level: 1, order: 1, type: "test", blocks: [{ kind: "paragraph", text: "I love my school. My classroom is clean and bright. We study English every day and help our friends learn." }], instructions: "Choose a duration and type until the timer ends.", sourceExercise: "English Test", contentStatus: "custom", timeLimit: 60, unlockTrack: "test-en" }),
  lesson({ title: "Khmer Typing Test", titleKhmer: "តេស្តវាយអក្សរខ្មែរ", slug: "test-km-standard", language: "km", category: "typing-tests", level: 1, order: 1, type: "test", blocks: [{ kind: "paragraph", text: "ខ្ញុំស្រឡាញ់សាលារបស់ខ្ញុំ។ ខ្ញុំអានសៀវភៅរាល់ថ្ងៃ និងជួយមិត្តភក្តិរបស់ខ្ញុំ។" }], instructions: "ជ្រើសរើសរយៈពេល រួចវាយរហូតដល់អស់ពេល។", sourceExercise: "Khmer Test", contentStatus: "custom", timeLimit: 60, unlockTrack: "test-km" }),
].map((item) => ({ ...item, content: { ...item.content, durationOptions: [30, 60, 180, 300] } }));

const practiceTemplates = [
  ["en", "word", "English Word Practice", easyWords.slice(0, 20)], ["en", "sentence", "English Sentence Practice", sentenceTopics.slice(0, 5).map(([, items]) => items[0])], ["en", "paragraph", "English Paragraph Practice", ["Practice helps me type accurately. I sit tall and keep my hands relaxed. I look ahead to the next word and type with a steady rhythm. After each sentence, I check the spaces and punctuation."]], ["en", "paragraph", "English Custom Practice", ["I can replace this sample with my own text. Before I begin, I read the whole passage once. I type one idea at a time and correct mistakes calmly. Careful daily practice helps my speed grow."]],
  ["km", "word", "Khmer Word Practice", allKhmerWords.slice(0, 20)], ["km", "sentence", "Khmer Sentence Practice", khmerSentenceTopics.slice(0, 5).flatMap(([, , items]) => items.slice(0, 2))], ["km", "paragraph", "Khmer Paragraph Practice", ["ការហាត់វាយជាប្រចាំជួយឱ្យខ្ញុំវាយបានត្រឹមត្រូវ និងលឿន។ ខ្ញុំអង្គុយឱ្យត្រង់ និងរក្សាដៃឱ្យស្រាល។ ខ្ញុំមើលពាក្យបន្ទាប់ ហើយវាយដោយចង្វាក់ថេរ។ ពេលវាយចប់ ខ្ញុំពិនិត្យចន្លោះ និងសញ្ញាខណ្ឌ។ ខ្ញុំផ្តោតលើភាពត្រឹមត្រូវ មុនពេលបង្កើនល្បឿន។"]], ["km", "paragraph", "Khmer Custom Practice", ["ខ្ញុំអាចប្តូរអត្ថបទនេះទៅជាអត្ថបទផ្ទាល់ខ្លួន។ មុនចាប់ផ្តើម ខ្ញុំអានអត្ថបទទាំងមូលម្តង។ ខ្ញុំវាយម្តងមួយគំនិត និងកែតម្រូវកំហុសដោយស្ងប់ស្ងាត់។ ការហាត់ដោយប្រុងប្រយ័ត្នជួយឱ្យល្បឿនរបស់ខ្ញុំកើនឡើង។ ខ្ញុំពិនិត្យពាក្យពិបាក ចន្លោះ និងសញ្ញាខណ្ឌមុនបញ្ចប់។"]],
].map(([language, type, title, items], index) => itemLesson({ title, titleKhmer: language === "km" ? title.replace("Khmer", "ខ្មែរ") : "", slug: `practice-${language}-${type}-${index + 1}`, language, category: "practice-templates", level: 1, order: index + 1, type, items, instructions: "Select this template or replace it with custom text.", sourceExercise: "Practice Template", contentStatus: "custom", unlockTrack: `practice-${language}-${type}-${index}` }));

const gameNames = ["Falling Words", "Balloon Typing", "Picture Typing", "Speed Challenge"];
const gameLessons = ["en", "km"].flatMap((language) => gameNames.map((name, index) => itemLesson({ title: `${language === "km" ? "Khmer" : "English"} ${name}`, titleKhmer: language === "km" ? `${name} ខ្មែរ` : "", slug: `game-${language}-${name.toLowerCase().replace(/[^a-z]+/g, "-")}`, language, category: "typing-games", level: 1, order: index + 1, type: "game", items: language === "km" ? allKhmerWords.slice(index * 5, index * 5 + 10) : easyWords.slice(index * 10, index * 10 + 15), instructions: `Play ${name} using ${language === "km" ? "Khmer" : "English"} words.`, sourceExercise: `${name} Game`, contentStatus: "custom", unlockTrack: `game-${language}-${index}` })));

const computerSkillNames = ["Copy", "Paste", "Cut", "Undo", "Redo", "Font", "Font Size", "Bold", "Italic", "Underline", "Font Color", "Highlight", "Alignment", "Bullets", "Numbering", "Pictures", "Shapes"];
const computerSkillPracticeText = "My School\nI love my school. My school is beautiful. My classroom is clean and bright. We learn English and Khmer every day.";
const computerSkills = [
  ...computerSkillNames.map((skill, index) => lesson({ title: skill, slug: `computer-skill-${skill.toLowerCase().replace(/[^a-z]+/g, "-")}`, language: "en", category: "computer-skills", level: Math.floor(index / 6) + 1, order: index + 1, type: "computer-skill", blocks: [{ kind: "formatting", text: computerSkillPracticeText, items: [skill] }], instructions: `Complete the typing task, then use the ${skill} tool.`, sourceExercise: `Microsoft Word Skill - ${skill}`, contentStatus: "custom", unlockTrack: skillTrack })),
  lesson({ title: "Editing Skills Review", slug: "computer-skill-editing-review", language: "en", category: "computer-skills", level: 3, order: 18, type: "computer-skill", blocks: [{ kind: "formatting", text: computerSkillPracticeText, items: ["Copy", "Paste", "Cut", "Undo", "Redo"] }], instructions: "Complete all editing operations.", sourceExercise: "Computer Skills Editing Review", contentStatus: "custom", difficulty: "medium", unlockTrack: skillTrack }),
  lesson({ title: "Formatting Skills Review", slug: "computer-skill-formatting-review", language: "en", category: "computer-skills", level: 3, order: 19, type: "computer-skill", blocks: [{ kind: "formatting", text: computerSkillPracticeText, items: ["Bold", "Font Size", "Font Color", "Alignment", "Bullets"] }], instructions: "Complete all formatting operations.", sourceExercise: "Computer Skills Formatting Review", contentStatus: "custom", difficulty: "medium", unlockTrack: skillTrack }),
  lesson({ title: "Word Skills Challenge", slug: "computer-skill-final-challenge", language: "en", category: "computer-skills", level: 3, order: 20, type: "computer-skill", blocks: [{ kind: "formatting", text: computerSkillPracticeText, items: ["Bold", "Font Size", "Alignment", "Pictures", "Shapes"] }], instructions: "Type the text and complete every formatting requirement.", sourceExercise: "Computer Skills Final Challenge", contentStatus: "custom", difficulty: "challenge", unlockTrack: skillTrack }),
];

export const englishCurriculum = [...englishLevel1, ...englishLevel2, ...englishLevel3, ...englishLevel4, ...englishLevel5, ...englishLevel6, ...englishLevel7];
export const khmerCurriculum = [...khmerLevel1, ...khmerLevel2, ...khmerLevel3, ...khmerLevel4, ...khmerLevel5, ...khmerLevel6];
export const retiredLessonSlugs = ["test-en-beginner", "test-km-beginner", "en-easy-words-11", "km-consonants-08-review", "km-consonants-09-alternating", "km-consonants-10-complete-review", "km-combinations-01", "km-combinations-02", "km-combinations-03", "km-combinations-04"];
export const seedLessons = [...englishCurriculum, ...khmerCurriculum, ...computerSkills, ...typingTests, ...practiceTemplates, ...gameLessons];

export const curriculumCounts = {
  english: Object.fromEntries(Array.from({ length: 7 }, (_, index) => [index + 1, englishCurriculum.filter((item) => item.level === index + 1).length])),
  khmer: Object.fromEntries(Array.from({ length: 6 }, (_, index) => [index + 1, khmerCurriculum.filter((item) => item.level === index + 1).length])),
  computerSkills: computerSkills.length,
};
