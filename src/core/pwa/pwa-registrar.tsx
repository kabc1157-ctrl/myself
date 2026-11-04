"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      void navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      }).then((registration) => registration.update());
    };

    window.addEventListener("load", register, { once: true });
    const refreshOnReturn = () => { if (document.visibilityState === "visible") register(); };
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => {
      window.removeEventListener("load", register);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, []);

  return null;
}
