"use client";

import {
  WorkspaceFrame,
  WorkspaceHeading,
} from "@/components/workspace-frame";

export function ManagerShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceFrame>
      <WorkspaceHeading
        title="Manager sign-off"
        description="Approve ready and deny decisions, then release client notifications."
      />
      <div className="flex-1">{children}</div>
    </WorkspaceFrame>
  );
}
