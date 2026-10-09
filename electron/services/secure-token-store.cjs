const fs = require("node:fs/promises");
const path = require("node:path");

const { app, safeStorage } = require("electron");

function getTokenPath() {
  return path.join(app.getPath("userData"), "secure-session.json");
}

async function getRefreshToken() {
  try {
    const stored = JSON.parse(await fs.readFile(getTokenPath(), "utf8"));
    if (safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(Buffer.from(stored.token, "base64"));
      } catch {
        return Buffer.from(stored.token, "base64").toString("utf8");
      }
    }
    return Buffer.from(stored.token, "base64").toString("utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    await clearRefreshToken();
    return null;
  }
}

async function setRefreshToken(token) {
  if (typeof token !== "string" || token.length < 32) {
    throw new TypeError("A valid refresh token is required.");
  }

  let encrypted = null;
  if (safeStorage.isEncryptionAvailable()) {
    try {
      encrypted = safeStorage.encryptString(token).toString("base64");
    } catch {
      encrypted = Buffer.from(token).toString("base64");
    }
  } else {
    encrypted = Buffer.from(token).toString("base64");
  }

  await fs.mkdir(path.dirname(getTokenPath()), { recursive: true });
  await fs.writeFile(
    getTokenPath(),
    JSON.stringify({ token: encrypted }),
    { mode: 0o600 },
  );
}

async function clearRefreshToken() {
  try {
    await fs.unlink(getTokenPath());
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

module.exports = { clearRefreshToken, getRefreshToken, setRefreshToken };
