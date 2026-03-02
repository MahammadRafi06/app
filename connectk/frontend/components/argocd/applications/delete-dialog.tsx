"use client";

import { useState } from "react";
import { type Application } from "@/lib/argocd-schemas";
import { useDeleteApplication } from "@/hooks/argocd/use-applications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

interface DeleteDialogProps {
  app: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteDialog({ app, open, onOpenChange, onDeleted }: DeleteDialogProps) {
  const del = useDeleteApplication();
  const [confirm, setConfirm] = useState("");
  const [cascade, setCascade] = useState(true);
  const [propagation, setPropagation] = useState<"foreground" | "background" | "orphan">("foreground");

  const isConfirmed = confirm === app?.metadata.name;

  function handleDelete() {
    if (!app || !isConfirmed) return;
    del.mutate(
      {
        name: app.metadata.name,
        cascade,
        propagationPolicy: propagation,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setConfirm("");
          onDeleted?.();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setConfirm(""); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Application
          </DialogTitle>
          <DialogDescription>
            This action is irreversible. The application and optionally its managed resources will be removed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Cascade */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="cascade"
              checked={cascade}
              onCheckedChange={(c) => setCascade(!!c)}
              className="mt-0.5"
            />
            <label htmlFor="cascade" className="cursor-pointer space-y-0.5">
              <p className="text-sm font-medium">Cascade delete</p>
              <p className="text-xs text-muted-foreground">
                Also delete all Kubernetes resources managed by this app.
              </p>
            </label>
          </div>

          {cascade && (
            <div className="space-y-1.5">
              <Label>Propagation Policy</Label>
              <div className="flex gap-3">
                {(["foreground", "background", "orphan"] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm capitalize">
                    <input
                      type="radio"
                      name="propagation"
                      value={opt}
                      checked={propagation === opt}
                      onChange={() => setPropagation(opt)}
                      className="accent-primary"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Confirm name */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-name">
              Type <strong>{app?.metadata.name}</strong> to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={app?.metadata.name}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); setConfirm(""); }}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isConfirmed || del.isPending}
            onClick={handleDelete}
          >
            {del.isPending ? "Deleting…" : "Delete Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
