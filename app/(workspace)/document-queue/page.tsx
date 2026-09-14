import type { Metadata } from "next";
import { DocumentQueue } from "./document-queue";

export const metadata: Metadata = {
  title: "Document Queue",
  description: "Cached document reviews awaiting processing",
};

export default function DocumentQueuePage() {
  return <DocumentQueue />;
}
