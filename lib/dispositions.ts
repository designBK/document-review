import type { Finding } from "@/lib/findings";
import type { ReviewStatus } from "@/lib/reviews";

export const DISPOSITION_DECISIONS = [
  "ready_for_sign_off",
  "awaiting_client",
  "denied",
] as const;

export type DispositionDecision = (typeof DISPOSITION_DECISIONS)[number];

export const DISPOSITION_DECISION_LABELS: Record<DispositionDecision, string> = {
  ready_for_sign_off: "Ready for sign-off",
  awaiting_client: "Request client information",
  denied: "Deny packet",
};

export type DispositionFindingSnapshot = {
  id: string;
  title: string;
  summary: string;
  type: Finding["type"];
  severity: Finding["severity"];
  status: Finding["status"];
  disagreementReason: string | null;
  suggestedAction: string | null;
};

export type ReviewDisposition = {
  id: string;
  reviewId: string;
  decision: DispositionDecision;
  note: string | null;
  findingSnapshot: DispositionFindingSnapshot[];
  aiRecommendedDecision: DispositionDecision | null;
  aiRecommendationSummary: string | null;
  aiRecommendationRationale: string[];
  aiRecommendationConfidence: number | null;
  notificationProvider: string;
  notificationMessageId: string | null;
  notificationStatus: string;
  notificationSummary: string | null;
  createdBy: string | null;
  createdAt: string;
};

export type ReadinessItem = {
  reviewId: string;
  businessName: string;
  status: ReviewStatus;
  disposition: ReviewDisposition;
};

export function getDispositionDecisionLabel(decision: DispositionDecision) {
  return DISPOSITION_DECISION_LABELS[decision] ?? decision;
}

export function getNotificationStatusLabel(status: string) {
  switch (status) {
    case "pending_sign_off":
      return "Pending manager sign-off";
    case "queued":
      return "Email queued (stub)";
    case "sent":
      return "Email sent";
    case "failed":
      return "Email failed";
    default:
      return status;
  }
}

export function buildFindingSnapshot(
  findings: Finding[],
  decision: DispositionDecision
): DispositionFindingSnapshot[] {
  const included = findings.filter((finding) => {
    if (finding.status === "disagreed") return true;
    if (finding.status !== "open") return false;
    if (decision === "awaiting_client") return true;
    return finding.severity === "blocker";
  });

  return included.map((finding) => ({
    id: finding.id,
    title: finding.title,
    summary: finding.summary,
    type: finding.type,
    severity: finding.severity,
    status: finding.status,
    disagreementReason: finding.disagreementReason,
    suggestedAction: finding.suggestedAction,
  }));
}

export function dispositionDecisionToReviewStatus(
  decision: DispositionDecision
): ReviewStatus {
  return decision;
}
