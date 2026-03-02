"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface BadgesDialogProps {
  appName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BadgesDialog({ appName, open, onOpenChange }: BadgesDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const badgeBase = `${baseUrl}/api/badge`;

  const statusUrl = `${badgeBase}?name=${encodeURIComponent(appName)}`;
  const healthUrl = `${badgeBase}?name=${encodeURIComponent(appName)}&revision=true`;

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  }

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
    <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => copy(text, label)}>
      {copied === label ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );

  const markdown = `[![App Status](${statusUrl})](${baseUrl}/applications/${encodeURIComponent(appName)})`;
  const rst = `.. image:: ${statusUrl}\n   :target: ${baseUrl}/applications/${encodeURIComponent(appName)}`;
  const html = `<a href="${baseUrl}/applications/${encodeURIComponent(appName)}"><img src="${statusUrl}" alt="App Status" /></a>`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Status Badge: {appName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Badge URL</Label>
            <div className="flex items-center gap-2">
              <Input value={statusUrl} readOnly className="text-xs font-mono" />
              <CopyBtn text={statusUrl} label="url" />
            </div>
          </div>

          <Tabs defaultValue="markdown">
            <TabsList>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
              <TabsTrigger value="rst">RST</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>
            <TabsContent value="markdown" className="mt-2">
              <div className="flex items-start gap-2">
                <pre className="flex-1 rounded-md border bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap">{markdown}</pre>
                <CopyBtn text={markdown} label="md" />
              </div>
            </TabsContent>
            <TabsContent value="rst" className="mt-2">
              <div className="flex items-start gap-2">
                <pre className="flex-1 rounded-md border bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap">{rst}</pre>
                <CopyBtn text={rst} label="rst" />
              </div>
            </TabsContent>
            <TabsContent value="html" className="mt-2">
              <div className="flex items-start gap-2">
                <pre className="flex-1 rounded-md border bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap">{html}</pre>
                <CopyBtn text={html} label="html" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
