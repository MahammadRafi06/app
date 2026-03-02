import { Suspense } from "react";
import FullscreenLogsPage from "./logs-page-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading logs...</div>}>
      <FullscreenLogsPage />
    </Suspense>
  );
}
