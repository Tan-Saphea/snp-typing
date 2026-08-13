import bcrypt from "bcrypt";

import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { Class } from "../models/Class.js";
import { Lesson } from "../models/Lesson.js";
import { User } from "../models/User.js";
import { SchoolSetting } from "../models/SchoolSetting.js";
import { retiredLessonSlugs, seedLessons } from "./lessonData.js";

function requireSeedPasswords() {
  const missing = [
    "SEED_ADMIN_PASSWORD",
    "SEED_TEACHER_PASSWORD",
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

async function seedUsersAndClass() {
  const admin = await upsertUser(
    {
      username: "admin",
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      status: "active",
    },
    env.SEED_ADMIN_PASSWORD,
  );
  const teacher = await upsertUser(
    {
      username: "teacher",
      firstName: "Teacher",
      lastName: "A",
      role: "teacher",
      status: "active",
    },
    env.SEED_TEACHER_PASSWORD,
  );

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
        { ...student, role: "student", status: "active" },
        env.SEED_STUDENT_PASSWORD,
      ),
    );
  }

  const schoolClass = await Class.findOneAndUpdate(
    {
      teacher: teacher.id,
      name: "Computer Level 1",
      academicYear: "2026-2027",
    },
    {
      $set: {
        level: "Level 1",
        students: students.map((student) => student.id),
        status: "active",
      },
    },
    { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true },
  );

  await User.updateMany(
    { _id: { $in: students.map((student) => student.id) } },
    { $set: { class: schoolClass.id } },
  );

  return { admin, teacher, students };
}

async function seedLessonRecords(admin) {
  const previousLessonByTrack = new Map();
  const lessonBySlug = new Map();
  const currentSlugs = new Set(seedLessons.map((item) => item.slug));
  const retiredLessons = await Lesson.find({ slug: { $in: retiredLessonSlugs } });

  for (const retired of retiredLessons) {
    if (currentSlugs.has(retired.slug)) continue;
    retired.isActive = false;
    retired.isPublished = false;
    retired.category = `retired-${retired.slug}`;
    retired.updatedBy = admin.id;
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
          createdBy: admin.id,
          updatedBy: admin.id,
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
  const { admin } = await seedUsersAndClass();
  await SchoolSetting.findOneAndUpdate({ key: "default" }, { $setOnInsert: { key: "default", updatedBy: admin.id } }, { upsert: true, setDefaultsOnInsert: true });
  await seedLessonRecords(admin);
  console.log(
    `Seed complete: 5 users, 1 class, and ${seedLessons.length} lessons/tests.`,
  );
}

run()
  .then(disconnectDatabase)
  .catch(async (error) => {
    console.error("Seed failed.", error);
    await disconnectDatabase();
    process.exitCode = 1;
  });
