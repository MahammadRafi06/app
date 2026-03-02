"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeyValueEditorProps {
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function KeyValueEditor({
  values,
  onChange,
  label,
  disabled,
  className,
}: KeyValueEditorProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const entries = Object.entries(values);

  function handleAdd() {
    if (!newKey.trim()) return;
    onChange({ ...values, [newKey.trim()]: newValue });
    setNewKey("");
    setNewValue("");
  }

  function handleRemove(key: string) {
    const next = { ...values };
    delete next[key];
    onChange(next);
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}

      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([k, v]) => (
            <Badge key={k} variant="secondary" className="font-mono text-[10px] gap-1 pr-1">
              {k}={v}
              {!disabled && (
                <button
                  onClick={() => handleRemove(k)}
                  className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Input
            placeholder="value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={handleAdd} disabled={!newKey.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
