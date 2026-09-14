export const REVIEW_STATUSES = [
  "new",
  "under_review",
  "issues_found",
  "awaiting_client",
  "ready_for_sign_off",
  "signed_off",
  "denied",
  "cancelled",
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  new: "New",
  under_review: "Under review",
  issues_found: "Issues found",
  awaiting_client: "Awaiting client",
  ready_for_sign_off: "Ready for sign off",
  signed_off: "Signed off",
  denied: "Denied",
  cancelled: "Cancelled",
};

export type ReviewDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
};

export type Review = {
  id: string;
  businessName: string;
  status: ReviewStatus;
  documents: ReviewDocument[];
  createdAt: string;
  updatedAt: string;
};

export const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.odt,.ods,.odp";

export const DOCUMENT_ACCEPT_LABEL =
  "PDF, Word, Excel, PowerPoint, text, CSV, or OpenDocument";

export const REVIEWS_CHANGED_EVENT = "reviews:changed";

export function notifyReviewsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REVIEWS_CHANGED_EVENT));
  }
}

export function getReviewStatusLabel(status: ReviewStatus) {
  return REVIEW_STATUS_LABELS[status] ?? status;
}
