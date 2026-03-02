"use client";

import React, { createContext, useContext } from "react";
import { useSettings, useCanI } from "@/hooks/argocd/use-settings";
import type { AuthSettings } from "@/lib/argocd-schemas";

interface SettingsContextValue {
  settings: AuthSettings | undefined;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: undefined,
  isLoading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useSettings();

  return (
    <SettingsContext.Provider value={{ settings: data, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  return useContext(SettingsContext);
}

/**
 * Hook to check if the current user can perform an action.
 * Wraps useCanI with a convenient interface.
 *
 * @example
 * const { data: canSync } = usePermission("applications", "sync", `${project}/${appName}`);
 */
export function usePermission(
  resource: string,
  action: string,
  subresource: string,
  enabled = true
) {
  return useCanI(resource, action, subresource, enabled);
}
