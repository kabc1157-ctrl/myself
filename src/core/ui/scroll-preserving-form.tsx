"use client";

import { useActionState, useEffect, useRef, type ComponentPropsWithoutRef } from "react";

type ScrollPreservingFormProps = Omit<ComponentPropsWithoutRef<"form">, "action"> & {
  action: (formData: FormData) => Promise<unknown>;
};

export function ScrollPreservingForm({ action, children, ...props }: ScrollPreservingFormProps) {
  const scrollPosition = useRef<number | null>(null);
  const [, formAction, isPending] = useActionState(async (state: number, formData: FormData) => {
    scrollPosition.current = window.scrollY;
    await action(formData);
    return state + 1;
  }, 0);

  useEffect(() => {
    if (!isPending && scrollPosition.current !== null) {
      const position = scrollPosition.current;
      scrollPosition.current = null;
      requestAnimationFrame(() => window.scrollTo({ top: position, behavior: "instant" }));
    }
  }, [isPending]);

  return <form action={formAction} {...props}>{children}</form>;
}
