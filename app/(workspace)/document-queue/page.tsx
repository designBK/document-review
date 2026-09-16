import type { Metadata } from "next";
import { DocumentQueue } from "./document-queue";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Document review intake queue",
};

export default function DocumentQueuePage() {
  return <DocumentQueue />;
}
