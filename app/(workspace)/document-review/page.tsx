import type { Metadata } from "next";
import { DocumentReviewWorkspace } from "./document-review-workspace";

export const metadata: Metadata = {
  title: "Document Review",
};

export default function DocumentReviewPage() {
  return <DocumentReviewWorkspace />;
}
