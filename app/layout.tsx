import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SoundProvider } from "./hooks/SoundContext";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

const SITE_URL = "https://karthikmannem.com";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  metadataBase: new URL(SITE_URL),
  title: "Karthik Mannem | Machine Learning & AI Engineer",
  description:
    "Karthik Mannem is a Machine Learning & AI Engineer building production AI systems with LLMs, RAG, ML, and agentic workflows. M.S. CS at CSUN, Los Angeles. Open to full-time roles.",
  keywords: [
    "Machine Learning Engineer",
    "AI Engineer",
    "LangChain",
    "RAG",
    "Python",
    "LLM",
    "PyTorch",
    "Portfolio",
    "Karthik Mannem",
    "CSUN",
    "Los Angeles",
    "Generative AI",
  ],
  authors: [{ name: "Karthik Mannem", url: SITE_URL }],
  creator: "Karthik Mannem",
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Karthik Mannem — Machine Learning & AI Engineer",
    description:
      "AI systems you can inspect, test, and trust. Case studies with the evidence behind them: a tax workpaper where every number carries its proof, honest demand forecasts, and a grounded RAG agent.",
    siteName: "Karthik Mannem",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Karthik Mannem, Machine Learning & AI Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Karthik Mannem — Machine Learning & AI Engineer",
    description: "AI systems you can inspect, test, and trust. Case studies with the evidence behind them.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

// Structured data for Google rich results
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Karthik Mannem",
  url: SITE_URL,
  jobTitle: "Machine Learning Engineer",
  alumniOf: {
    "@type": "EducationalOrganization",
    name: "California State University, Northridge",
  },
  sameAs: [
    "https://github.com/mannemkarthik010",
    "https://linkedin.com/in/karthik-mannem-2008b4225",
  ],
  knowsAbout: [
    "Machine Learning",
    "LangChain",
    "RAG",
    "PyTorch",
    "TensorFlow",
    "Python",
    "Large Language Models",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <SoundProvider>
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}
