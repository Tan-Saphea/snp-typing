import http from "node:http";

import { createApp } from "./app.js";
import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";
import { env } from "./config/env.js";

let server;
let isShuttingDown = false;

async function start() {
  await connectDatabase();
  server = http.createServer(createApp());
  server.listen(env.PORT, "0.0.0.0", () => {
    console.log(`SNP Typing API listening on port ${env.PORT}`);
  });
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Closing SNP Typing API.`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

start().catch((error) => {
  console.error("SNP Typing API failed to start.", error);
  process.exit(1);
});
