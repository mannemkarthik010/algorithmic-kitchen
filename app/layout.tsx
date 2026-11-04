import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono, Bagel_Fat_One } from "next/font/google";
import "./globals.css";
import { SoundProvider } from "./hooks/SoundContext";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"], weight: ["300", "400", "600"], style: ["normal", "italic"],
  variable: "--font-cormorant", display: "swap",
});
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-dm-sans", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });
const bagel = Bagel_Fat_One({ subsets: ["latin"], weight: "400", variable: "--font-bagel", display: "swap" });

const SITE_URL = "https://thealgorithmickitchen.vercel.app";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  metadataBase: new URL(SITE_URL),
  title: "Karthik Mannem — Machine Learning & AI Engineer | The Algorithmic Kitchen",
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
      "Cooking intelligent systems from raw data, creativity, and machine learning. ML Engineer portfolio by Karthik Mannem.",
    siteName: "The Algorithmic Kitchen",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Algorithmic Kitchen — Karthik Mannem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Karthik Mannem — Machine Learning & AI Engineer",
    description: "ML Engineer portfolio. Cooking AI systems with LangChain, RAG, and PyTorch.",
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
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} ${bagel.variable}`}>
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
