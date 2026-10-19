"use client";

import { useEffect, type RefObject } from "react";

export function useCollapseDetailsOnSuccess(
  formRef: RefObject<HTMLFormElement | null>,
  state: { message?: string },
) {
  useEffect(() => {
    if (!state.message) return;
    const details = formRef.current?.closest("details");
    if (!details) return;
    details.open = false;
    const storageKey = details.dataset.detailsStorageKey;
    if (storageKey) window.sessionStorage.setItem(storageKey, "closed");
  }, [formRef, state]);
}
