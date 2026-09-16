"use client";

import { NewReviewDialog } from "@/components/new-review-dialog";
import {
  WorkspaceFrame,
  WorkspaceHeading,
} from "@/components/workspace-frame";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceFrame>
      <WorkspaceHeading
        title="Dashboard"
        description="Intake queue for new and in-progress document reviews."
        actions={<NewReviewDialog />}
      />
      <div className="flex-1">{children}</div>
    </WorkspaceFrame>
  );
}
