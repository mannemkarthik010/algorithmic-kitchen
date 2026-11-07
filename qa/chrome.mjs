import { existsSync } from "node:fs";

/** Where to find Chrome. Set CHROME=/path/to/chrome to override. */
const CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];
export const CHROME = process.env.CHROME ?? CANDIDATES.find((p) => existsSync(p));
if (!CHROME) throw new Error("Chrome not found. Install Google Chrome or set CHROME=/path/to/chrome");
