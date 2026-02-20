"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmText,
  onConfirm,
  onCancel,
  dangerous = false,
  loading,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const canConfirm = !confirmText || typed === confirmText;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative card p-6 w-full max-w-md mx-4 z-10">
        <button onClick={onCancel} className="absolute top-4 right-4 btn-ghost p-1">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-4">
          {dangerous && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{description}</p>

            {confirmText && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Type <span className="font-mono font-semibold">{confirmText}</span> to confirm:
                </p>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="input"
                  placeholder={confirmText}
                  autoFocus
                />
              </div>
            )}

            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={onCancel} className="btn-secondary">Cancel</button>
              <button
                onClick={() => { if (canConfirm) { onConfirm(); setTyped(""); } }}
                disabled={!canConfirm || loading}
                className={cn(dangerous ? "btn-danger" : "btn-primary")}
              >
                {loading ? "Processing..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
