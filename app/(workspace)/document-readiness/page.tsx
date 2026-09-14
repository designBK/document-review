import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Readiness",
};

export default function DocumentReadinessPage() {
  return (
    <p className="text-sm text-muted-foreground">Document Readiness content</p>
  );
}
