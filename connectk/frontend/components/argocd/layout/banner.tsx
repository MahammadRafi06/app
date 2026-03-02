"use client";

import { useState, useEffect } from "react";
import { useSettingsContext } from "@/components/argocd/settings-context";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const DISMISSED_KEY = "fluxboard-banner-dismissed";

export function Banner() {
  const { settings } = useSettingsContext();
  const [dismissed, setDismissed] = useState(true);

  const content = settings?.uiBannerContent;
  const url = settings?.uiBannerURL;
  const permanent = settings?.uiBannerPermanent;
  const position = settings?.uiBannerPosition ?? "top";

  useEffect(() => {
    if (!content) return;
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (stored === content) {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, [content]);

  if (!content || dismissed) return null;

  function handleDismiss() {
    if (!permanent) {
      localStorage.setItem(DISMISSED_KEY, content!);
      setDismissed(true);
    }
  }

  const inner = url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
      {content}
    </a>
  ) : (
    content
  );

  return (
    <div
      className={`bg-primary text-primary-foreground px-4 py-2 text-sm flex items-center justify-center gap-3 ${
        position === "bottom" ? "order-last" : ""
      }`}
    >
      <span>{inner}</span>
      {!permanent && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-primary-foreground hover:text-primary-foreground/80"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
