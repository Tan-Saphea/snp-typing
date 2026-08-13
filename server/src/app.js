import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import { requestId } from "./middleware/requestId.js";
import apiRoutes from "./routes/index.js";
import ApiError from "./utils/ApiError.js";

function corsOrigin(origin, callback) {
  const isAllowed =
    !origin ||
    env.CLIENT_ORIGINS.includes(origin) ||
    (origin === "null" && env.ALLOW_NULL_ORIGIN);

  callback(
    isAllowed
      ? null
      : new ApiError(403, "ORIGIN_NOT_ALLOWED", "This application origin is not allowed."),
    isAllowed,
  );
}

export function createApp() {
  const app = express();

  if (env.TRUST_PROXY) {
    app.set("trust proxy", 1);
  }

  app.disable("x-powered-by");
  app.use(requestId);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-Id",
        "X-SNP-Client",
      ],
      exposedHeaders: ["X-Request-Id"],
    }),
  );
  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ extended: false, limit: "256kb" }));
  app.use(cookieParser());

  if (env.NODE_ENV !== "test") {
    app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  }

  app.use("/api", apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
