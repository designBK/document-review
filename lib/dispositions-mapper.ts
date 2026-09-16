import type {
  DispositionDecision,
  DispositionFindingSnapshot,
  ReviewDisposition,
} from "@/lib/dispositions";

type DispositionRow = {
  id: string;
  review_id: string;
  decision: DispositionDecision;
  note: string | null;
  finding_snapshot: DispositionFindingSnapshot[] | null;
  ai_recommended_decision?: DispositionDecision | null;
  ai_recommendation_summary?: string | null;
  ai_recommendation_rationale?: string[] | null;
  ai_recommendation_confidence?: number | null;
  notification_provider: string;
  notification_message_id: string | null;
  notification_status: string;
  notification_summary: string | null;
  created_by: string | null;
  created_at: string;
};

export function mapDisposition(row: DispositionRow): ReviewDisposition {
  return {
    id: row.id,
    reviewId: row.review_id,
    decision: row.decision,
    note: row.note,
    findingSnapshot: row.finding_snapshot ?? [],
    aiRecommendedDecision: row.ai_recommended_decision ?? null,
    aiRecommendationSummary: row.ai_recommendation_summary ?? null,
    aiRecommendationRationale: row.ai_recommendation_rationale ?? [],
    aiRecommendationConfidence:
      row.ai_recommendation_confidence == null
        ? null
        : Number(row.ai_recommendation_confidence),
    notificationProvider: row.notification_provider,
    notificationMessageId: row.notification_message_id,
    notificationStatus: row.notification_status,
    notificationSummary: row.notification_summary,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
