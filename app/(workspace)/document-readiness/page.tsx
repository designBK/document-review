import { Suspense } from "react";
import type { Metadata } from "next";
import { DocumentReadinessBoard } from "./document-readiness-board";

export const metadata: Metadata = {
  title: "Document Readiness",
};

export default function DocumentReadinessPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Document Readiness
        </h2>
        <p className="text-sm text-muted-foreground">
          Disposition and findings package for the packet you are reviewing.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading readiness…</p>
        }
      >
        <DocumentReadinessBoard />
      </Suspense>
    </div>
  );
}
