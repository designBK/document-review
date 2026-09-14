import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Review",
};

export default function DocumentReviewPage() {
  return <p className="text-sm text-muted-foreground">Document Review content</p>;
}
