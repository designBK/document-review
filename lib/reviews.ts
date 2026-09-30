export const REVIEW_STATUSES = [
  "new",
  "under_review",
  "issues_found",
  "awaiting_client",
  "ready_for_sign_off",
  "returned_for_review",
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
  returned_for_review: "Returned for review",
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
  returnReason: string | null;
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

/** Badge tone: positive → success, mid-pipeline → info/warning, declined → error. */
export function getReviewStatusBadgeVariant(
  status: ReviewStatus
): "success" | "info" | "warning" | "destructive" | "secondary" {
  switch (status) {
    case "signed_off":
      return "success";
    case "new":
    case "under_review":
    case "ready_for_sign_off":
      return "info";
    case "issues_found":
    case "awaiting_client":
    case "returned_for_review":
      return "warning";
    case "denied":
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}
