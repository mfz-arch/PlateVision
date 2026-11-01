import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { CookieBanner } from "../components/CookieBanner";
import { PWAInstallPrompt } from "../components/PWAInstallPrompt";

export const viewport: Viewport = {
  themeColor: "#14171d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://platevision.app"),
  title: "PlateVision AI — Computer Vision Nutrition & Macro Tracker",
  description: "Scan your food plate with AI. Calculate calories, protein, carbs and water targets instantly. Private, accessible, and secure.",
  applicationName: "PlateVision AI",
  authors: [{ name: "PlateVision AI" }],
  keywords: ["nutrition tracker", "calorie counter", "macro tracker", "food scanner", "computer vision", "AI nutrition"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PlateVision"
  },
  openGraph: {
    title: "PlateVision AI — Smart Nutrition & Macro Scanner",
    description: "Scan your food plate. AI calculates calories, protein, and macros from a photo in seconds.",
    url: "https://platevision.app",
    siteName: "PlateVision AI",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "PlateVision AI Logo"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
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
          <PWAInstallPrompt />
          <CookieBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
