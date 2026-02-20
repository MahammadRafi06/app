"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryClient";
import { SSEEvent } from "@/types";

export function useSSE() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);

  const handleEvent = useCallback(
    (event: MessageEvent) => {
      try {
        if (event.lastEventId) {
          lastEventIdRef.current = event.lastEventId;
        }
        const data: SSEEvent = JSON.parse(event.data);
        switch (data.type) {
          case "deployment.status_changed":
          case "deployment.metrics_updated":
            queryClient.invalidateQueries({ queryKey: ["deployments"] });
            if (data.payload.dep_id) {
              queryClient.invalidateQueries({ queryKey: ["deployments", data.payload.dep_id as string] });
            }
            break;
          case "cluster.connectivity_changed":
          case "cluster.cache_refreshed":
            queryClient.invalidateQueries({ queryKey: ["clusters"] });
            if (data.payload.cluster_id) {
              queryClient.invalidateQueries({ queryKey: ["clusters", data.payload.cluster_id as string] });
            }
            break;
          case "node.status_changed":
            queryClient.invalidateQueries({ queryKey: ["nodes"] });
            break;
        }
      } catch {
        // heartbeat pings
      }
    },
    [queryClient]
  );

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      let url = "/api/events/stream";
      if (lastEventIdRef.current) {
        url += `?last_event_id=${encodeURIComponent(lastEventIdRef.current)}`;
      }
      const es = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => setConnected(true);
      es.onerror = () => {
        setConnected(false);
        es.close();
        reconnectTimer = setTimeout(connect, 5000);
      };

      es.addEventListener("deployment.status_changed", handleEvent);
      es.addEventListener("deployment.metrics_updated", handleEvent);
      es.addEventListener("cluster.connectivity_changed", handleEvent);
      es.addEventListener("cluster.cache_refreshed", handleEvent);
      es.addEventListener("node.status_changed", handleEvent);
      es.addEventListener("system.maintenance", handleEvent);
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      eventSourceRef.current?.close();
    };
  }, [handleEvent]);

  return { connected };
}
