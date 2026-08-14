import bcrypt from "bcrypt";

import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { Lesson } from "../models/Lesson.js";
import { User } from "../models/User.js";
import { retiredLessonSlugs, seedLessons } from "./lessonData.js";

function requireSeedPasswords() {
  const missing = [
    "SEED_STUDENT_PASSWORD",
  ].filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing development seed variables: ${missing.join(", ")}`);
  }
}

async function upsertUser(data, password) {
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  return User.findOneAndUpdate(
    { username: data.username },
    { $set: { ...data, passwordHash } },
    { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function seedLearners() {
  const studentRecords = [
    {
      username: "dara",
      studentId: "SNP-001",
      firstName: "Dara",
      lastName: "Sok",
      khmerName: "សុខ ដារ៉ា",
      gender: "male",
    },
    {
      username: "sophea",
      studentId: "SNP-002",
      firstName: "Sophea",
      lastName: "Chan",
      khmerName: "ចាន់ សុភា",
      gender: "female",
    },
    {
      username: "vanna",
      studentId: "SNP-003",
      firstName: "Vanna",
      lastName: "Kim",
      khmerName: "គឹម វណ្ណា",
      gender: "unspecified",
    },
  ];
  const students = [];

  for (const student of studentRecords) {
    students.push(
      await upsertUser(
        { ...student, status: "active" },
        env.SEED_STUDENT_PASSWORD,
      ),
    );
  }

  return students;
}

async function seedLessonRecords(actor) {
  const previousLessonByTrack = new Map();
  const lessonBySlug = new Map();
  const currentSlugs = new Set(seedLessons.map((item) => item.slug));
  const retiredLessons = await Lesson.find({ slug: { $in: retiredLessonSlugs } });

  for (const retired of retiredLessons) {
    if (currentSlugs.has(retired.slug)) continue;
    retired.isActive = false;
    retired.isPublished = false;
    retired.category = `retired-${retired.slug}`;
    retired.updatedBy = actor.id;
    await retired.save();
  }

  for (const lessonData of seedLessons) {
    const { prerequisiteSlug, unlockTrack, ...lessonFields } = lessonData;
    const track = unlockTrack ?? `${lessonData.language}:${lessonData.category}:${lessonData.level}`;
    const previousLesson = previousLessonByTrack.get(track);
    const explicitPrerequisite = prerequisiteSlug
      ? lessonBySlug.get(prerequisiteSlug) ??
        (await Lesson.findOne({ slug: prerequisiteSlug }))
      : null;
    const lesson = await Lesson.findOneAndUpdate(
      { slug: lessonData.slug },
      {
        $set: {
          ...lessonFields,
          prerequisiteLesson: explicitPrerequisite?.id ?? previousLesson?.id ?? null,
          createdBy: actor.id,
          updatedBy: actor.id,
        },
      },
      { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true },
    );

    if (lesson.isActive && lesson.isPublished) previousLessonByTrack.set(track, lesson);
    lessonBySlug.set(lesson.slug, lesson);
  }
}

async function run() {
  requireSeedPasswords();
  await connectDatabase();
  const learners = await seedLearners();
  await seedLessonRecords(learners[0]);
  console.log(
    `Seed complete: ${learners.length} learners and ${seedLessons.length} lessons/tests.`,
  );
}

run()
  .then(disconnectDatabase)
  .catch(async (error) => {
    console.error("Seed failed.", error);
    await disconnectDatabase();
    process.exitCode = 1;
  });
