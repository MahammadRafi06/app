"use client";

import { type Application } from "@/lib/argocd-schemas";
import { formatDate, formatRelativeDate, repoUrlToDisplayName } from "@/lib/argocd-utils";
import { HealthBadge, SyncBadge, PhaseBadge } from "./status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GitBranch,
  Server,
  FolderOpen,
  Clock,
  User,
  Tag,
  Link2,
  Activity,
} from "lucide-react";

interface ApplicationSummaryProps {
  app: Application;
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex-1 min-w-0 text-sm">{children}</div>
    </div>
  );
}

export function ApplicationSummary({ app }: ApplicationSummaryProps) {
  const source = app.spec.source ?? app.spec.sources?.[0];
  const health = app.status?.health;
  const sync = app.status?.sync;
  const opState = app.status?.operationState;
  const summary = app.status?.summary;

  const labels = Object.entries(app.metadata.labels ?? {});
  const annotations = Object.entries(app.metadata.annotations ?? {})
    .filter(([k]) => !k.startsWith("kubectl.kubernetes.io"))
    .slice(0, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" /> Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 divide-y">
          <SummaryRow label="Health">
            <div className="flex items-center gap-2">
              <HealthBadge status={health?.status} />
              {health?.message && (
                <span className="text-muted-foreground text-xs truncate">{health.message}</span>
              )}
            </div>
          </SummaryRow>
          <SummaryRow label="Sync Status">
            <div className="flex items-center gap-2">
              <SyncBadge status={sync?.status} />
              {sync?.revision && (
                <code className="text-xs font-mono text-muted-foreground">
                  {sync.revision.slice(0, 8)}
                </code>
              )}
            </div>
          </SummaryRow>
          {opState?.phase && (
            <SummaryRow label="Operation">
              <div className="flex items-center gap-2">
                <PhaseBadge phase={opState.phase} />
                {opState.message && (
                  <span className="text-xs text-muted-foreground truncate">{opState.message}</span>
                )}
              </div>
            </SummaryRow>
          )}
          {opState?.finishedAt && (
            <SummaryRow label="Last Synced">
              <span className="text-muted-foreground">
                {formatRelativeDate(opState.finishedAt)}
                <span className="ml-1.5 text-xs opacity-70">({formatDate(opState.finishedAt)})</span>
              </span>
            </SummaryRow>
          )}
          {opState?.startedAt && opState.phase === "Running" && (
            <SummaryRow label="Started">
              <span className="text-muted-foreground">{formatRelativeDate(opState.startedAt)}</span>
            </SummaryRow>
          )}
        </CardContent>
      </Card>

      {/* Source */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4" /> Source
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 divide-y">
          {source ? (
            <>
              <SummaryRow label="Repository">
                <a
                  href={source.repoURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 truncate"
                >
                  {repoUrlToDisplayName(source.repoURL)}
                  <Link2 className="h-3 w-3 shrink-0" />
                </a>
              </SummaryRow>
              {source.targetRevision && (
                <SummaryRow label="Revision">
                  <code className="font-mono text-xs">{source.targetRevision}</code>
                </SummaryRow>
              )}
              {source.path && (
                <SummaryRow label="Path">
                  <code className="font-mono text-xs">{source.path}</code>
                </SummaryRow>
              )}
              {source.chart && (
                <SummaryRow label="Helm Chart">
                  <code className="font-mono text-xs">{source.chart}</code>
                </SummaryRow>
              )}
            </>
          ) : app.spec.sources && app.spec.sources.length > 0 ? (
            app.spec.sources.map((s, i) => (
              <SummaryRow key={i} label={`Source ${i + 1}`}>
                <span className="text-xs truncate">{repoUrlToDisplayName(s.repoURL)}</span>
              </SummaryRow>
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-4">No source configured.</p>
          )}
        </CardContent>
      </Card>

      {/* Destination */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Server className="h-4 w-4" /> Destination
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 divide-y">
          <SummaryRow label="Cluster">
            <code className="font-mono text-xs truncate block">
              {app.spec.destination.name ?? app.spec.destination.server ?? "—"}
            </code>
          </SummaryRow>
          <SummaryRow label="Namespace">
            <code className="font-mono text-xs">{app.spec.destination.namespace ?? "—"}</code>
          </SummaryRow>
          <SummaryRow label="Project">
            <span>{app.spec.project}</span>
          </SummaryRow>
        </CardContent>
      </Card>

      {/* Sync Policy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderOpen className="h-4 w-4" /> Sync Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 divide-y">
          {app.spec.syncPolicy?.automated ? (
            <>
              <SummaryRow label="Mode">
                <Badge variant="outline" className="text-xs">Automated</Badge>
              </SummaryRow>
              <SummaryRow label="Prune">
                <span className={app.spec.syncPolicy.automated.prune ? "text-emerald-600" : "text-muted-foreground"}>
                  {app.spec.syncPolicy.automated.prune ? "Enabled" : "Disabled"}
                </span>
              </SummaryRow>
              <SummaryRow label="Self-Heal">
                <span className={app.spec.syncPolicy.automated.selfHeal ? "text-emerald-600" : "text-muted-foreground"}>
                  {app.spec.syncPolicy.automated.selfHeal ? "Enabled" : "Disabled"}
                </span>
              </SummaryRow>
            </>
          ) : (
            <SummaryRow label="Mode">
              <Badge variant="outline" className="text-xs">Manual</Badge>
            </SummaryRow>
          )}
          {app.spec.syncPolicy?.syncOptions && app.spec.syncPolicy.syncOptions.length > 0 && (
            <SummaryRow label="Options">
              <div className="flex flex-wrap gap-1">
                {app.spec.syncPolicy.syncOptions.map((opt) => (
                  <Badge key={opt} variant="secondary" className="text-[10px]">{opt}</Badge>
                ))}
              </div>
            </SummaryRow>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      {(labels.length > 0 || annotations.length > 0 || (summary?.externalURLs && summary.externalURLs.length > 0)) && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag className="h-4 w-4" /> Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {summary?.externalURLs && summary.externalURLs.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">External URLs</p>
                <div className="flex flex-wrap gap-2">
                  {summary.externalURLs.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1">
                      {url} <Link2 className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {labels.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {labels.map(([k, v]) => (
                    <Badge key={k} variant="outline" className="font-mono text-[10px]">
                      {k}={v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {annotations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Annotations</p>
                <div className="flex flex-wrap gap-1.5">
                  {annotations.map(([k, v]) => (
                    <Badge key={k} variant="secondary" className="font-mono text-[10px]">
                      {k}: {v.length > 40 ? v.slice(0, 40) + "…" : v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
