import { Suspense } from "react";
import ApplicationsPage from "./applications-page-client";
import { PageSkeleton } from "@/components/argocd/shared/loading-skeleton";

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ApplicationsPage />
    </Suspense>
  );
}
