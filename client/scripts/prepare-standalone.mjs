import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const clientRoot = process.cwd();
const standaloneRoot = path.join(clientRoot, ".next", "standalone");
const candidates = [path.join(standaloneRoot, "client"), standaloneRoot];
let serverRoot = null;

for (const candidate of candidates) {
  try {
    if ((await stat(path.join(candidate, "server.js"))).isFile()) {
      serverRoot = candidate;
      break;
    }
  } catch {
    // Try the next supported standalone layout.
  }
}

if (!serverRoot) {
  throw new Error("Next.js standalone server output was not found.");
}

await mkdir(path.join(serverRoot, ".next"), { recursive: true });
await cp(
  path.join(clientRoot, ".next", "static"),
  path.join(serverRoot, ".next", "static"),
  { recursive: true, force: true },
);
await cp(
  path.join(clientRoot, "public"),
  path.join(serverRoot, "public"),
  { recursive: true, force: true },
);
