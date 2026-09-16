import { NextResponse } from "next/server";
import { mapDisposition } from "@/lib/dispositions-mapper";
import type { ReviewStatus } from "@/lib/reviews";
import { createAdminClient } from "@/lib/supabase/admin";

const READINESS_STATUSES: ReviewStatus[] = [
  "awaiting_client",
  "ready_for_sign_off",
  "denied",
];

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
        business_name,
        status,
        review_dispositions (
          id,
          review_id,
          decision,
          note,
          finding_snapshot,
          ai_recommended_decision,
          ai_recommendation_summary,
          ai_recommendation_rationale,
          ai_recommendation_confidence,
          notification_provider,
          notification_message_id,
          notification_status,
          notification_summary,
          created_by,
          created_at
        )
      `
      )
      .in("status", READINESS_STATUSES)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data ?? []).flatMap((review) => {
      const dispositions = Array.isArray(review.review_dispositions)
        ? review.review_dispositions
        : review.review_dispositions
          ? [review.review_dispositions]
          : [];

      if (dispositions.length === 0) return [];

      const latest = [...dispositions].sort((a, b) =>
        String(b.created_at).localeCompare(String(a.created_at))
      )[0];

      return [
        {
          reviewId: review.id,
          businessName: review.business_name,
          status: review.status as ReviewStatus,
          disposition: mapDisposition(latest),
        },
      ];
    });

    items.sort((a, b) =>
      b.disposition.createdAt.localeCompare(a.disposition.createdAt)
    );

    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load readiness board";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
