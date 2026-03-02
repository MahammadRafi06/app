"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface UrlFilters {
  search: string;
  health: string;
  sync: string;
  project: string;
  namespace: string;
  cluster: string;
  autoSync: string;
  favorites: string;
  labels: string[];
}

const defaults: UrlFilters = {
  search: "",
  health: "All",
  sync: "All",
  project: "All",
  namespace: "All",
  cluster: "All",
  autoSync: "All",
  favorites: "All",
  labels: [],
};

export function useUrlFilters(): [UrlFilters, (patch: Partial<UrlFilters>) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: UrlFilters = {
    search: searchParams.get("search") ?? defaults.search,
    health: searchParams.get("health") ?? defaults.health,
    sync: searchParams.get("sync") ?? defaults.sync,
    project: searchParams.get("project") ?? defaults.project,
    namespace: searchParams.get("namespace") ?? defaults.namespace,
    cluster: searchParams.get("cluster") ?? defaults.cluster,
    autoSync: searchParams.get("autoSync") ?? defaults.autoSync,
    favorites: searchParams.get("favorites") ?? defaults.favorites,
    labels: searchParams.getAll("labels"),
  };

  const setFilters = useCallback(
    (patch: Partial<UrlFilters>) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (key === "labels") {
          next.delete("labels");
          for (const l of value as string[]) next.append("labels", l);
        } else {
          const v = value as string;
          if (v === "" || v === "All" || v === defaults[key as keyof UrlFilters]) {
            next.delete(key);
          } else {
            next.set(key, v);
          }
        }
      }

      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return [filters, setFilters];
}
