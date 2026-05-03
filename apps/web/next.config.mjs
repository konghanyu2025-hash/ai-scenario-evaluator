import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: resolve(__dirname, "../.."),
  transpilePackages: ["@aise/core", "@aise/providers", "@aise/shared"],
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
