import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "생활관리",
    template: "%s | 생활관리",
  },
  description: "일기, 루틴, 근무 기록과 예상 급여를 한곳에서 관리하는 따뜻한 개인 생활 관리 플랫폼",
  manifest: "/manifest.webmanifest",
  applicationName: "생활관리",
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "생활관리",
    title: "생활관리",
    description: "일기, 루틴, 근무 기록과 예상 급여를 한곳에서 관리하세요.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "생활관리 서비스 미리보기" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "생활관리",
    description: "나의 일기와 루틴, 근무 기록을 한곳에서 관리하는 개인 생활 플랫폼",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
