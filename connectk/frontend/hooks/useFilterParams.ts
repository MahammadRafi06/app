"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useFilterParams<T extends Record<string, string>>(defaults: T) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo(() => {
    const result: Record<string, string> = {};
    for (const key of Object.keys(defaults)) {
      result[key] = searchParams.get(key) || defaults[key];
    }
    return result as T;
  }, [searchParams, defaults]);

  const setFilter = useCallback(
    (key: keyof T, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== defaults[key as string]) {
        params.set(key as string, value);
      } else {
        params.delete(key as string);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router, defaults]
  );

  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== defaults[key]) {
          params.set(key, value as string);
        } else {
          params.delete(key);
        }
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router, defaults]
  );

  return { filters, setFilter, setFilters };
}
