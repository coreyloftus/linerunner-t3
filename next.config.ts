import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Convert import.meta.url to __dirname equivalent
const __dirname = path.dirname(fileURLToPath(import.meta.url));

await import("./src/env.js");

type CustomWebpackConfig = {
  resolve: {
    alias: Record<string, string>;
  };
};

// Ensure the config type conforms to Next.js expectations with added resolve details
const config: NextConfig = {
  webpack: (config: CustomWebpackConfig) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "~": path.resolve(__dirname, "./src"),
    };
    return config;
  },
};

export default config;
