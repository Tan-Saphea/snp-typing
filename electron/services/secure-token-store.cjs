const fs = require("node:fs/promises");
const path = require("node:path");

const { app, safeStorage } = require("electron");

function getTokenPath() {
  return path.join(app.getPath("userData"), "secure-session.json");
}

async function getRefreshToken() {
  try {
    const stored = JSON.parse(await fs.readFile(getTokenPath(), "utf8"));
    return safeStorage.decryptString(Buffer.from(stored.token, "base64"));
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

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure credential storage is unavailable on this device.");
  }

  const encrypted = safeStorage.encryptString(token).toString("base64");
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
