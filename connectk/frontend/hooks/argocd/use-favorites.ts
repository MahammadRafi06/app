"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "fluxboard-favorites";

// Cache the snapshot so useSyncExternalStore gets a stable reference
let cachedSnapshot: string[] = [];

function readFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): string[] {
  return cachedSnapshot;
}

const emptyArray: string[] = [];
function getServerSnapshot(): string[] {
  return emptyArray;
}

let listeners: Array<() => void> = [];

function emitChange() {
  cachedSnapshot = readFromStorage();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  // Initialize cache on first subscribe
  if (listeners.length === 0) {
    cachedSnapshot = readFromStorage();
  }
  listeners = [...listeners, listener];

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) emitChange();
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((name: string) => {
    const current = readFromStorage();
    const next = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emitChange();
  }, []);

  const isFavorite = useCallback(
    (name: string) => favorites.includes(name),
    [favorites]
  );

  return { favorites, toggle, isFavorite };
}
