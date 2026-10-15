import Link from "next/link";

import { enabledServiceModules } from "@/core/navigation/modules";

export default function HomePage() {
  return (
    <main className="home">
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">PERSONAL LIFE PLATFORM</p>
        <h1 id="hero-title">하루를 가볍게 정리하세요.</h1>
        <p className="hero-description">
          일기와 루틴, 근무 기록을 한곳에서 차분하게 정리하는 개인 생활 공간입니다.
        </p>

        <nav aria-label="서비스">
          {enabledServiceModules.map((service) => (
            <Link className="service-card" href={service.href} key={service.id}>
              <span>{service.label}</span>
              <strong>{service.description}</strong>
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
