import crypto from "node:crypto";

import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export function signAccessToken(user) {
  return jwt.sign(
    { role: user.role },
    env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: "snp-typing-api",
      audience: "snp-typing-client",
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: "snp-typing-api",
    audience: "snp-typing-client",
  });
}

export function createRefreshTokenValue(userId) {
  return jwt.sign({}, env.JWT_REFRESH_SECRET, {
    subject: userId,
    jwtid: crypto.randomUUID(),
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: "snp-typing-api",
    audience: "snp-typing-refresh",
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "snp-typing-api",
    audience: "snp-typing-refresh",
  });
}

export function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpiry(token) {
  const decoded = jwt.decode(token);

  return new Date(decoded.exp * 1000);
}
