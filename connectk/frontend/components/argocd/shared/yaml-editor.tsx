"use client";

import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full min-h-[300px]" />,
});

interface YamlEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  height?: string;
  language?: string;
}

export function YamlEditor({
  value,
  onChange,
  readOnly = false,
  height = "400px",
  language = "yaml",
}: YamlEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="overflow-hidden rounded-lg border" style={{ height }}>
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
        onChange={onChange}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          folding: true,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          renderLineHighlight: "line",
          contextmenu: false,
        }}
      />
    </div>
  );
}
