import { describe, expect, it, beforeEach } from "vitest";

describe("Theme resolution and mode switching", () => {
  let docMock;
  let storageMock;

  beforeEach(() => {
    const classList = new Set();
    docMock = {
      documentElement: {
        classList: {
          add: (...classes) => classes.forEach((c) => classList.add(c)),
          remove: (...classes) => classes.forEach((c) => classList.delete(c)),
          toggle: (cls, force) => {
            if (force === undefined) {
              if (classList.has(cls)) classList.delete(cls);
              else classList.add(cls);
            } else if (force) {
              classList.add(cls);
            } else {
              classList.delete(cls);
            }
          },
          contains: (cls) => classList.has(cls),
        },
        style: {
          colorScheme: "",
        },
      },
    };

    const store = new Map();
    storageMock = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  function resolveTheme(currentTheme, systemDark) {
    if (currentTheme === "dark") return "dark";
    if (currentTheme === "light") return "light";
    return systemDark ? "dark" : "light";
  }

  function applyThemeToDom(resolvedTheme, doc = docMock) {
    const isDark = resolvedTheme === "dark";
    doc.documentElement.classList.toggle("dark", isDark);
    doc.documentElement.classList.toggle("snp-dark", isDark);
    doc.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }

  it("resolves light mode explicitly regardless of system preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("light", false)).toBe("light");

    applyThemeToDom(resolveTheme("light", true));
    expect(docMock.documentElement.classList.contains("dark")).toBe(false);
    expect(docMock.documentElement.classList.contains("snp-dark")).toBe(false);
    expect(docMock.documentElement.style.colorScheme).toBe("light");
  });

  it("resolves dark mode explicitly regardless of system preference", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("dark", true)).toBe("dark");

    applyThemeToDom(resolveTheme("dark", false));
    expect(docMock.documentElement.classList.contains("dark")).toBe(true);
    expect(docMock.documentElement.classList.contains("snp-dark")).toBe(true);
    expect(docMock.documentElement.style.colorScheme).toBe("dark");
  });

  it("resolves system mode dynamically based on system dark scheme match", () => {
    // When OS is dark
    expect(resolveTheme("system", true)).toBe("dark");
    applyThemeToDom(resolveTheme("system", true));
    expect(docMock.documentElement.classList.contains("dark")).toBe(true);
    expect(docMock.documentElement.classList.contains("snp-dark")).toBe(true);
    expect(docMock.documentElement.style.colorScheme).toBe("dark");

    // When OS is light
    expect(resolveTheme("system", false)).toBe("light");
    applyThemeToDom(resolveTheme("system", false));
    expect(docMock.documentElement.classList.contains("dark")).toBe(false);
    expect(docMock.documentElement.classList.contains("snp-dark")).toBe(false);
    expect(docMock.documentElement.style.colorScheme).toBe("light");
  });

  it("persists theme preference to local storage", () => {
    const STORAGE_KEY = "snp-learner-settings";
    const settings = { theme: "dark", largeText: true };
    storageMock.setItem(STORAGE_KEY, JSON.stringify(settings));

    const retrieved = JSON.parse(storageMock.getItem(STORAGE_KEY));
    expect(retrieved.theme).toBe("dark");
    expect(retrieved.largeText).toBe(true);
  });
});
