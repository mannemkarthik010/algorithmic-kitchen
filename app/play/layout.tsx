import type { Metadata, Viewport } from "next";

const URL_ = "https://karthikmannem.com/play";
const DESC = "ECHO//SHIFT is a time-loop puzzle game. Your past self is your teammate: record a run, then let it hold the switch while you walk through the door. Six handcrafted levels and a daily challenge.";

export const metadata: Metadata = {
  title: "ECHO//SHIFT: a time-loop puzzle game",
  description: DESC,
  alternates: { canonical: URL_ },
  icons: { icon: [{ url: "/play/icon.svg", type: "image/svg+xml" }], shortcut: "/play/icon.svg", apple: "/play/icon.svg" },
  openGraph: {
    type: "website", url: URL_, siteName: "ECHO//SHIFT", title: "ECHO//SHIFT: your past self is your teammate", description: DESC,
    images: [{ url: "/play/og.png", width: 1200, height: 630, alt: "ECHO//SHIFT: a time-loop puzzle game" }],
  },
  twitter: { card: "summary_large_image", title: "ECHO//SHIFT: your past self is your teammate", description: DESC, images: ["/play/og.png"] },
};
export const viewport: Viewport = { themeColor: "#06060b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
