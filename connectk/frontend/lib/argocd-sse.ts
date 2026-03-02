// SSE (Server-Sent Events) connection helper with reconnection logic

const BASE = "/api/argocd/api/v1";

export interface SSEOptions {
  onMessage: (data: unknown) => void;
  onError?: (err: Event) => void;
  onOpen?: () => void;
}

export function createSSEConnection(
  path: string,
  opts: SSEOptions
): () => void {
  const url = `${BASE}${path}`;
  let eventSource: EventSource | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = 1000;
  let destroyed = false;

  function connect() {
    if (destroyed) return;

    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      reconnectDelay = 1000; // reset backoff on successful connection
      opts.onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        opts.onMessage(data);
      } catch {
        // If not JSON, pass raw string
        opts.onMessage(event.data);
      }
    };

    eventSource.onerror = (err) => {
      opts.onError?.(err);
      eventSource?.close();
      eventSource = null;

      if (!destroyed) {
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        reconnectTimeout = setTimeout(() => {
          connect();
        }, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
      }
    };
  }

  connect();

  // Return cleanup function
  return () => {
    destroyed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
