"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useLocalStorageSync<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const subscribe = useCallback(
    (listener: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) listener();
      };
      window.addEventListener("storage", handler);
      // Also listen for same-tab updates via custom event
      const customHandler = () => listener();
      window.addEventListener(`ls-${key}`, customHandler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(`ls-${key}`, customHandler);
      };
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T) => {
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(`ls-${key}`));
    },
    [key]
  );

  return [value, setValue];
}
