import type { Metadata } from "next";
import "./globals.css";
import { SoundProvider } from "./hooks/SoundContext";

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
  title: "The Algorithmic Kitchen — Karthik Mannem | ML Engineer",
  description:
    "Portfolio of Karthik Mannem — ML Engineer cooking intelligent systems with LangChain, RAG, PyTorch, and LLMs. M.S. CS at CSUN, Los Angeles.",
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
    title: "The Algorithmic Kitchen — Karthik Mannem",
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
    title: "The Algorithmic Kitchen — Karthik Mannem",
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
    <html lang="en">
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
