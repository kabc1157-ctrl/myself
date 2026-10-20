import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "이음새",
    short_name: "이음새",
    description: "흩어진 기록 사이, 나를 발견하다. 일상의 기록을 연결하는 자기 이해·성장 앱",
    id: "/",
    start_url: "/home",
    scope: "/",
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
