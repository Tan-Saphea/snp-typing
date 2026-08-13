import path from "node:path";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
let apiOrigin = "";

try {
  apiOrigin = apiUrl ? new URL(apiUrl).origin : "";
} catch {
  apiOrigin = "";
}

const developmentScripts = process.env.NODE_ENV === "development"
  ? " 'unsafe-eval'"
  : "";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${developmentScripts}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*${apiOrigin ? ` ${apiOrigin}` : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  poweredByHeader: false,
  transpilePackages: ["@snp/shared"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
