"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSSEConnection } from "@/lib/argocd-sse";
import { ApplicationSchema, ApplicationTreeSchema } from "@/lib/argocd-schemas";
import { appKeys } from "./use-applications";

export function useSSEApplications(enabled: boolean) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setConnected(false);
      return;
    }

    cleanupRef.current = createSSEConnection("/stream/applications", {
      onOpen: () => setConnected(true),
      onMessage: (data) => {
        try {
          const event = data as { type: string; result: { application: unknown } };
          if (event.result?.application) {
            const app = ApplicationSchema.safeParse(event.result.application);
            if (app.success) {
              // Update the detail cache directly
              qc.setQueryData(appKeys.detail(app.data.metadata.name), app.data);
              // Invalidate list to trigger re-render
              qc.invalidateQueries({ queryKey: appKeys.list() });
            }
          }
        } catch {
          // Ignore parse errors on SSE
        }
      },
      onError: () => setConnected(false),
    });

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setConnected(false);
    };
  }, [enabled, qc]);

  return { connected };
}

export function useSSEResourceTree(appName: string, enabled: boolean) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    cleanupRef.current?.();

    if (!enabled || !appName) {
      setConnected(false);
      return;
    }

    cleanupRef.current = createSSEConnection(
      `/stream/applications/${encodeURIComponent(appName)}/resource-tree`,
      {
        onOpen: () => setConnected(true),
        onMessage: (data) => {
          try {
            const tree = ApplicationTreeSchema.safeParse(
              (data as { result: unknown }).result ?? data
            );
            if (tree.success) {
              qc.setQueryData(appKeys.tree(appName), tree.data);
            }
          } catch {
            // Ignore
          }
        },
        onError: () => setConnected(false),
      }
    );
  }, [appName, enabled, qc]);

  useEffect(() => {
    connect();
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setConnected(false);
    };
  }, [connect]);

  return { connected };
}
