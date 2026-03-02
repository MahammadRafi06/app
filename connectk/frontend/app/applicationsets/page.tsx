"use client";

import { useApplicationSets } from "@/hooks/argocd/use-applicationsets";
import { Header } from "@/components/argocd/layout/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageSkeleton } from "@/components/argocd/shared/loading-skeleton";
import { EmptyState } from "@/components/argocd/shared/empty-state";
import { ApplicationSetCard } from "@/components/argocd/applications/applicationset-card";
import { Layers } from "lucide-react";

export default function ApplicationSetsPage() {
  const { data, isLoading, error } = useApplicationSets();
  const items = data?.items ?? [];

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <Header
        title="ApplicationSets"
        description={`${items.length} application set${items.length !== 1 ? "s" : ""}`}
      />
      <ScrollArea className="flex-1">
        <div className="p-6">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-4">
              Failed to load ApplicationSets: {(error as Error).message}
            </div>
          )}

          {items.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No ApplicationSets"
              description="ApplicationSets generate Applications from templates and generators."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((appSet) => (
                <ApplicationSetCard key={appSet.metadata.name} appSet={appSet} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
