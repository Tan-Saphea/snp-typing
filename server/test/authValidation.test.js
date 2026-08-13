import assert from "node:assert/strict";
import test from "node:test";

import { USER_ROLES } from "@snp/shared";

import { authorize } from "../src/middleware/authorize.js";
import {
  loginSchema,
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

test("refresh validation supports the browser cookie flow", () => {
  const result = refreshSchema.safeParse({ body: {} });

  assert.equal(result.success, true);
});

test("role middleware allows configured roles", () => {
  let nextError;
  const middleware = authorize(USER_ROLES.ADMIN, USER_ROLES.TEACHER);

  middleware(
    { auth: { role: USER_ROLES.TEACHER } },
    {},
    (error) => {
      nextError = error;
    },
  );

  assert.equal(nextError, undefined);
});

test("role middleware rejects an unconfigured role", () => {
  let nextError;
  const middleware = authorize(USER_ROLES.ADMIN);

  middleware(
    { auth: { role: USER_ROLES.STUDENT } },
    {},
    (error) => {
      nextError = error;
    },
  );

  assert.equal(nextError.status, 403);
  assert.equal(nextError.code, "FORBIDDEN");
});
