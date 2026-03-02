"use client";

import { useState } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Columns2, Rows2 } from "lucide-react";
import { useTheme } from "next-themes";

interface DiffViewerProps {
  original: string;
  modified: string;
  language?: string;
  height?: string;
}

export function DiffViewer({
  original,
  modified,
  language = "yaml",
  height = "500px",
}: DiffViewerProps) {
  const [inline, setInline] = useState(false);
  const { resolvedTheme } = useTheme();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Live State</span>
          <span>vs</span>
          <span>Desired State</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => setInline(!inline)}
        >
          {inline ? <Columns2 className="h-3.5 w-3.5" /> : <Rows2 className="h-3.5 w-3.5" />}
          {inline ? "Side by Side" : "Inline"}
        </Button>
      </div>
      <div className="rounded-md border overflow-hidden">
        <DiffEditor
          original={original}
          modified={modified}
          language={language}
          height={height}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          options={{
            readOnly: true,
            renderSideBySide: !inline,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            lineNumbers: "on",
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
