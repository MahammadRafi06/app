"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EditableField({
  value,
  onSave,
  label,
  placeholder,
  disabled,
  className,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function handleSave() {
    if (draft !== value) onSave(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        {label && <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>}
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          placeholder={placeholder}
          className="h-7 text-sm"
        />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("group flex items-center gap-1.5", className)}>
      {label && <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>}
      <span className="text-sm">{value || <span className="text-muted-foreground italic">{placeholder ?? "—"}</span>}</span>
      {!disabled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setEditing(true)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
