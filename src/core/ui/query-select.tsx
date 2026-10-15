"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type QuerySelectProps = {
  ariaLabel: string;
  className?: string;
  name: string;
  options: { label: string; value: string }[];
  value: string;
};

export function QuerySelect({ ariaLabel, className, name, options, value }: QuerySelectProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      aria-label={ariaLabel}
      className={className}
      onChange={(event) => {
        const next = new URLSearchParams(searchParams.toString());
        if (event.target.value) next.set(name, event.target.value);
        else next.delete(name);
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      }}
      value={value}
    >
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}
