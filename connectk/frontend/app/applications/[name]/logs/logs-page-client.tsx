"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Header } from "@/components/argocd/layout/header";
import { PodLogsViewer } from "@/components/argocd/applications/pod-logs-viewer";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function FullscreenLogsPage() {
  const { name } = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const decodedName = decodeURIComponent(name);

  const podName = searchParams.get("pod") ?? "";
  const namespace = searchParams.get("namespace") ?? "";
  const container = searchParams.get("container") ?? "";
  const containers = container ? [container] : [];

  return (
    <>
      <Header title={`Logs: ${podName || decodedName}`} />
      <div className="flex-1 flex flex-col">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground px-6 py-2">
          <Link href={`/applications/${name}`} className="hover:text-foreground flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            {decodedName}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Logs</span>
        </nav>
        <div className="flex-1 px-6 pb-6">
          {podName ? (
            <PodLogsViewer
              appName={decodedName}
              podName={podName}
              containers={containers}
              namespace={namespace}
            />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No pod specified. Add ?pod=name&namespace=ns&container=c to the URL.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
