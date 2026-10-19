"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

type PersistentDetailsProps = Omit<ComponentPropsWithoutRef<"details">, "open" | "onToggle"> & {
  defaultOpen?: boolean;
  storageKey: string;
};

export function PersistentDetails({ defaultOpen = false, storageKey, children, ...props }: PersistentDetailsProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const fullKey = `myself:details:${storageKey}`;

  useEffect(() => {
    const stored = window.sessionStorage.getItem(fullKey);
    if (detailsRef.current && stored !== null) detailsRef.current.open = stored === "open";
  }, [fullKey]);

  return (
    <details
      data-details-storage-key={fullKey}
      open={defaultOpen}
      onToggle={(event) => {
        window.sessionStorage.setItem(fullKey, event.currentTarget.open ? "open" : "closed");
      }}
      ref={detailsRef}
      {...props}
    >
      {children}
    </details>
  );
}
