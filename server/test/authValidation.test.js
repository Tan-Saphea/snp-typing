import assert from "node:assert/strict";
import test from "node:test";

import {
  loginSchema,
  registerSchema,
  refreshSchema,
} from "../src/validators/authValidators.js";

test("login validation trims a valid username", () => {
  const result = loginSchema.safeParse({
    body: { username: "  dara  ", password: "Student123!" },
  });

  assert.equal(result.success, true);
  assert.equal(result.data.body.username, "dara");
});

test("login validation rejects short passwords", () => {
  const result = loginSchema.safeParse({
    body: { username: "dara", password: "short" },
  });

  assert.equal(result.success, false);
});

test("registration accepts a learner-created account", () => {
  const result = registerSchema.safeParse({
    body: {
      firstName: "Sovann",
      lastName: "Kim",
      username: "sovann.kim",
      password: "Typing123",
      gender: "unspecified",
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.data.body.username, "sovann.kim");
});

test("registration rejects weak passwords and unsafe usernames", () => {
  const result = registerSchema.safeParse({
    body: {
      firstName: "Sovann",
      username: "Sovann Kim!",
      password: "alllowercase",
    },
  });

  assert.equal(result.success, false);
});

test("refresh validation supports the browser cookie flow", () => {
  const result = refreshSchema.safeParse({ body: {} });

  assert.equal(result.success, true);
});
