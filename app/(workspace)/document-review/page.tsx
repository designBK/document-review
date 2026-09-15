import { Suspense } from "react";
import type { Metadata } from "next";
import { DocumentReviewWorkspace } from "./document-review-workspace";

export const metadata: Metadata = {
  title: "Document Review",
};

export default function DocumentReviewPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-muted-foreground">Loading reviews…</p>}
    >
      <DocumentReviewWorkspace />
    </Suspense>
  );
}
