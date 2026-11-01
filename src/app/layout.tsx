import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { CookieBanner } from "../components/CookieBanner";

export const metadata: Metadata = {
  title: "PlateVision AI — Computer Vision Nutrition & Macro Tracker",
  description: "Scan your food plate with AI. Calculate calories, protein, carbs and water targets instantly. Private, accessible, and secure.",
  applicationName: "PlateVision AI",
  authors: [{ name: "PlateVision AI" }],
  keywords: ["nutrition tracker", "calorie counter", "macro tracker", "food scanner", "computer vision", "AI nutrition"],
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#14171d] text-white">
        {/* WCAG Skip to Main Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-[#b6ff2e] focus:text-[#14171d] focus:font-extrabold focus:text-xs focus:rounded-xl focus:shadow-[0_0_20px_rgba(182,255,46,0.5)] focus:outline-none"
        >
          Skip to main content
        </a>
        <LanguageProvider>
          {children}
          <CookieBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
