import assert from "node:assert/strict";
import test from "node:test";

import {
  loginSchema,
  registerSchema,
  refreshSchema,
  resetPasswordSchema,
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
      name: "Sovann Kim",
      username: "sovann.kim",
      password: "password123",
      securityAnswer: "Admin.snpis@2013",
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.data.body.username, "sovann.kim");
  assert.equal(result.data.body.securityQuestion, "Recovery Key");
});

test("registration rejects weak passwords and unsafe usernames", () => {
  const result = registerSchema.safeParse({
    body: {
      name: "Sovann",
      username: "Sovann Kim!",
      password: "123",
      securityQuestion: "Recovery Key",
      securityAnswer: "Admin.snpis@2013",
    },
  });

  assert.equal(result.success, false);
});

test("refresh validation supports the browser cookie flow", () => {
  const result = refreshSchema.safeParse({ body: {} });

  assert.equal(result.success, true);
});

test("password reset requires the recovery answer", () => {
  const missingAnswer = resetPasswordSchema.safeParse({
    body: { username: "dara", newPassword: "NewPassword123!" },
  });
  const completeRequest = resetPasswordSchema.safeParse({
    body: {
      username: "dara",
      newPassword: "NewPassword123!",
      securityAnswer: "Admin.snpis@2013",
    },
  });

  assert.equal(missingAnswer.success, false);
  assert.equal(completeRequest.success, true);
});
