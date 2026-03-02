"use client";

import { useSettingsContext } from "@/components/argocd/settings-context";

export function CustomCSS() {
  const { settings } = useSettingsContext();

  if (!settings?.uiCssURL) return null;

  // eslint-disable-next-line @next/next/no-css-tags
  return <link rel="stylesheet" href={settings.uiCssURL} />;
}
