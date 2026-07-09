import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't get confused by unrelated
  // lockfiles in parent directories on some machines.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
