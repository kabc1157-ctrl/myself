"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function InvestmentPeriodEnhancer() { const router = useRouter(); useEffect(() => { const handler = (event: Event) => { const form = event.target as HTMLFormElement; if (!form.matches(".investment-inline-period")) return; event.preventDefault(); const data = new FormData(form); const year = String(data.get("year") ?? ""); const month = String(data.get("month") ?? ""); router.push(`/investment?year=${year}&month=${month}`, { scroll: false }); }; document.addEventListener("submit", handler); return () => document.removeEventListener("submit", handler); }, [router]); return null; }
