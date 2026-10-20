import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { AppLaunchSplash } from "@/core/brand/app-launch-splash";
import { PwaRegistrar } from "@/core/pwa/pwa-registrar";

import "./globals.css";

const gmarketSans = localFont({
  src: [
    {
      path: "./fonts/GmarketSansTTFMedium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/GmarketSansTTFBold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-gmarket-sans",
  display: "swap",
  fallback: ["Apple SD Gothic Neo", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "이음새",
    template: "%s | 이음새",
  },
  description: "흩어진 기록 사이, 나를 발견하다. 일상의 기록을 연결해 나의 패턴과 변화를 발견하는 AI 자기 이해·성장 플랫폼",
  manifest: "/manifest.webmanifest",
  applicationName: "이음새",
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "이음새",
    title: "이음새 | 흩어진 기록 사이, 나를 발견하다",
    description: "일상의 기록을 연결해 나의 패턴과 변화를 발견하세요.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "이음새 서비스 미리보기" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "이음새 | 흩어진 기록 사이, 나를 발견하다",
    description: "일상의 기록을 연결해 나의 패턴과 변화를 발견하는 자기 이해·성장 플랫폼",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html className={gmarketSans.variable} lang="ko">
      <body>
        <AppLaunchSplash />
        {children}
        <PwaRegistrar />
      </body>
    </html>
  );
}
