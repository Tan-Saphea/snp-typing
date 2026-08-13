const fs = require("node:fs");
const path = require("node:path");

const { app, screen } = require("electron");

const defaultBounds = Object.freeze({ width: 1366, height: 768 });

function getStatePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function isVisible(bounds) {
  if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) {
    return false;
  }

  const display = screen.getDisplayMatching(bounds);
  const area = display.workArea;

  return (
    bounds.x < area.x + area.width - 100 &&
    bounds.x + bounds.width > area.x + 100 &&
    bounds.y < area.y + area.height - 100 &&
    bounds.y + bounds.height > area.y + 100
  );
}

function readWindowState() {
  try {
    const state = JSON.parse(fs.readFileSync(getStatePath(), "utf8"));
    return isVisible(state) ? state : defaultBounds;
  } catch {
    return defaultBounds;
  }
}

function saveWindowState(window) {
  const state = {
    ...window.getNormalBounds(),
    maximized: window.isMaximized(),
  };

  fs.mkdirSync(path.dirname(getStatePath()), { recursive: true });
  fs.writeFileSync(getStatePath(), JSON.stringify(state));
}

module.exports = { readWindowState, saveWindowState };
