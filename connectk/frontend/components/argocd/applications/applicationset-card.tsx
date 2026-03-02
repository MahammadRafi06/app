"use client";

import { type ApplicationSet } from "@/lib/argocd-schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/argocd-utils";
import { Layers, Clock } from "lucide-react";
import Link from "next/link";

interface ApplicationSetCardProps {
  appSet: ApplicationSet;
}

export function ApplicationSetCard({ appSet }: ApplicationSetCardProps) {
  const generators = appSet.spec?.generators ?? [];
  const conditions = appSet.status?.conditions ?? [];
  const hasError = conditions.some((c) => c.type === "ErrorOccurred" && c.status === "True");

  return (
    <Link href={`/applicationsets/${encodeURIComponent(appSet.metadata.name)}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2 truncate">
              <Layers className="h-4 w-4 shrink-0" />
              {appSet.metadata.name}
            </span>
            {hasError && <Badge variant="destructive" className="text-[10px]">Error</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex flex-wrap gap-1">
            {generators.map((g, i) => {
              const type = Object.keys(g).filter((k) => k !== "selector")[0] ?? "unknown";
              return (
                <Badge key={i} variant="secondary" className="text-[10px]">
                  {type}
                </Badge>
              );
            })}
          </div>
          {appSet.spec?.template?.spec?.project && (
            <p className="text-xs text-muted-foreground">
              Project: {appSet.spec.template.spec.project}
            </p>
          )}
          {appSet.metadata.creationTimestamp && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeDate(appSet.metadata.creationTimestamp)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
