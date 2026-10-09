import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import process from "node:process";

const serverRoot = "/Users/tansaphea/Documents/5. Persional/Typing/release/win-unpacked/resources/app.asar.unpacked/client/.next/standalone/client";
const serverScript = path.join(serverRoot, "server.js");
const port = 3892;

console.log("Starting server from:", serverScript);
console.log("cwd:", serverRoot);

const child = spawn(process.execPath, [serverScript], {
  cwd: serverRoot,
  env: {
    ...process.env,
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    PORT: String(port),
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";

child.stdout.on("data", (d) => {
  stdout += d.toString();
  process.stdout.write("[SERVER OUT] " + d.toString());
});

child.stderr.on("data", (d) => {
  stderr += d.toString();
  process.stderr.write("[SERVER ERR] " + d.toString());
});

child.on("exit", (code) => {
  console.log("Server exited with code:", code);
});

// Wait 2 seconds for server to boot, then make HTTP requests
await new Promise((r) => setTimeout(r, 2000));

function fetchUrl(urlPath) {
  return new Promise((resolve) => {
    http.get(`http://127.0.0.1:${port}${urlPath}`, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        resolve({ status: res.statusCode, length: data.length });
      });
    }).on("error", (err) => {
      resolve({ error: err.message });
    });
  });
}

const routes = ["/", "/games", "/login", "/register", "/settings", "/khmer", "/english"];

for (const route of routes) {
  const result = await fetchUrl(route);
  console.log(`Route ${route}:`, result);
}

child.kill();
console.log("Done test.");
