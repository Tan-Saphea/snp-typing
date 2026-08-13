import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function findJavaScriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findJavaScriptFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".js") ? [entryPath] : [];
  });
}

for (const file of findJavaScriptFiles(path.join(serverRoot, "src"))) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

console.log("Server syntax check passed.");
