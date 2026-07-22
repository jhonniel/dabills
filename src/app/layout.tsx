import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";

import { SkipToContent } from "@/components/layout/skip-to-content";
import { AppProviders } from "@/components/providers/app-providers";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Track every subscription. Never miss a payment. Manage recurring bills effortlessly with DaBills.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  applicationName: APP_NAME,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description:
      "Track every subscription. Never miss a payment. Manage recurring bills effortlessly with DaBills.",
    type: "website",
    siteName: APP_NAME,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SkipToContent />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
