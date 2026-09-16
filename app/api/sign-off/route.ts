import { NextResponse } from "next/server";
import { mapDisposition } from "@/lib/dispositions-mapper";
import type { ReviewStatus } from "@/lib/reviews";
import { createAdminClient } from "@/lib/supabase/admin";

const DISPOSITION_SELECT = `
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
`;

/** Manager queue: ready/deny dispositions awaiting sign-off before client email. */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("review_dispositions")
      .select(
        `
        ${DISPOSITION_SELECT},
        reviews (
          id,
          business_name,
          status
        )
      `
      )
      .eq("notification_status", "pending_sign_off")
      .in("decision", ["ready_for_sign_off", "denied"])
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data ?? []).flatMap((row) => {
      const review = Array.isArray(row.reviews) ? row.reviews[0] : row.reviews;
      if (!review) return [];

      return [
        {
          reviewId: review.id as string,
          businessName: review.business_name as string,
          status: review.status as ReviewStatus,
          disposition: mapDisposition(row),
        },
      ];
    });

    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load sign-off queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
