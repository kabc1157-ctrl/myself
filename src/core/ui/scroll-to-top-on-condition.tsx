"use client";
import { useEffect } from "react";
export function ScrollToTopOnCondition({ active }: { active: boolean }) { useEffect(() => { if (active) window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" })); }, [active]); return null; }
