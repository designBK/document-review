import { Suspense } from "react";
import type { Metadata } from "next";
import { DocumentReadinessBoard } from "./document-readiness-board";

export const metadata: Metadata = {
  title: "Document Readiness",
};

export default function DocumentReadinessPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading readiness…</p>
      }
    >
      <DocumentReadinessBoard />
    </Suspense>
  );
}
