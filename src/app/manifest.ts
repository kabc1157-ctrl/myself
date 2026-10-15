import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "생활관리",
    short_name: "생활관리",
    description: "일기, 루틴, 근무 기록을 위한 개인 생활 관리 앱",
    start_url: "/routines",
    display: "standalone",
    background_color: "#f2e8dc",
    theme_color: "#586486",
    lang: "ko-KR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
