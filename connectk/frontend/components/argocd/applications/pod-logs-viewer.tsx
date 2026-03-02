"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getPodLogsUrl } from "@/lib/argocd-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Download,
  Copy,
  Search,
  Pause,
  Play,
  Clock,
  WrapText,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LogLine {
  id: number;
  content: string;
  timestamp?: string;
  highlight?: boolean;
}

interface PodLogsViewerProps {
  appName: string;
  podName: string;
  containers?: string[];
  namespace?: string;
}

export function PodLogsViewer({
  appName,
  podName,
  containers = [],
  namespace,
}: PodLogsViewerProps) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [filter, setFilter] = useState("");
  const [container, setContainer] = useState(containers[0] ?? "");
  const [follow, setFollow] = useState(true);
  const [timestamps, setTimestamps] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [previous, setPrevious] = useState(false);
  const [tailLines, setTailLines] = useState(200);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lineIdRef = useRef(0);

  const filteredLines = filter
    ? lines.filter((l) =>
        l.content.toLowerCase().includes(filter.toLowerCase())
      )
    : lines;

  const fetchLogs = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLines([]);
    setLoading(true);

    const url = getPodLogsUrl(appName, podName, {
      container: container || undefined,
      namespace,
      follow,
      tailLines,
      timestamps,
      previous,
    });

    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`Logs request failed: ${res.status}`);
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";

        const newLines: LogLine[] = [];
        for (const part of parts) {
          if (!part.trim()) continue;
          // Each line may be raw text or JSON: { result: { content: "..." } }
          let content = part;
          try {
            const parsed = JSON.parse(part);
            content = parsed?.result?.content ?? part;
          } catch {
            // raw text line
          }
          newLines.push({
            id: ++lineIdRef.current,
            content,
          });
        }

        if (newLines.length > 0) {
          setLines((prev) => {
            const next = [...prev, ...newLines];
            // Cap at 5000 lines in memory
            return next.length > 5000 ? next.slice(-5000) : next;
          });
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        toast.error(`Failed to load logs: ${(err as Error)?.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [appName, podName, container, follow, tailLines, timestamps, previous, namespace]);

  useEffect(() => {
    fetchLogs();
    return () => abortRef.current?.abort();
  }, [fetchLogs]);

  // Auto-scroll
  useEffect(() => {
    if (follow && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, follow]);

  function handleCopy() {
    const text = filteredLines.map((l) => l.content).join("\n");
    navigator.clipboard.writeText(text).then(() => toast.success("Logs copied"));
  }

  function handleDownload() {
    const text = filteredLines.map((l) => l.content).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${podName}-${container || "logs"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b p-2 bg-muted/30">
        {/* Container selector */}
        {containers.length > 1 && (
          <Select value={container} onValueChange={setContainer}>
            <SelectTrigger className="h-7 w-40 text-xs">
              <SelectValue placeholder="Container" />
            </SelectTrigger>
            <SelectContent>
              {containers.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Tail lines */}
        <Select value={String(tailLines)} onValueChange={(v) => setTailLines(Number(v))}>
          <SelectTrigger className="h-7 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[50, 100, 200, 500, 1000].map((n) => (
              <SelectItem key={n} value={String(n)} className="text-xs">
                {n} lines
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter */}
        <div className="relative">
          <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            className="h-7 pl-6 w-32 text-xs"
          />
        </div>

        {/* Toggles */}
        <TooltipProvider delayDuration={0}>
          {[
            { icon: follow ? Pause : Play, label: follow ? "Pause" : "Follow", active: follow, onClick: () => setFollow(!follow) },
            { icon: Clock, label: "Timestamps", active: timestamps, onClick: () => setTimestamps(!timestamps) },
            { icon: WrapText, label: "Wrap", active: wrapLines, onClick: () => setWrapLines(!wrapLines) },
          ].map(({ icon: Icon, label, active, onClick }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={onClick}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}

          <div className="flex items-center gap-1.5">
            <Switch id="prev-logs" checked={previous} onCheckedChange={setPrevious} className="h-4 w-7" />
            <Label htmlFor="prev-logs" className="text-xs cursor-pointer">Previous</Label>
          </div>
        </TooltipProvider>

        <div className="ml-auto flex gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLines([])}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Log output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto bg-slate-950 font-mono text-xs text-slate-100 p-3"
        onScroll={(e) => {
          const el = e.currentTarget;
          const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 80;
          if (!atBottom && follow) setFollow(false);
        }}
      >
        {loading && lines.length === 0 && (
          <p className="text-slate-400 animate-pulse">Loading logs…</p>
        )}
        {filteredLines.length === 0 && !loading && (
          <p className="text-slate-500">No log output.</p>
        )}
        {filteredLines.map((line) => (
          <div
            key={line.id}
            className={cn("leading-5", !wrapLines && "whitespace-nowrap")}
          >
            {filter ? (
              <HighlightedLine content={line.content} filter={filter} />
            ) : (
              <span>{line.content}</span>
            )}
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t px-3 py-1 text-[10px] text-muted-foreground bg-muted/20">
        <span>{filteredLines.length.toLocaleString()} lines{filter && " (filtered)"}</span>
        {loading && <span className="text-blue-400">● streaming</span>}
        {!loading && <span>● idle</span>}
      </div>
    </div>
  );
}

function HighlightedLine({ content, filter }: { content: string; filter: string }) {
  if (!filter) return <span>{content}</span>;
  const regex = new RegExp(`(${escapeRegex(filter)})`, "gi");
  const parts = content.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
