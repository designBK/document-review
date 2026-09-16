import { NextResponse } from "next/server";
import type { IdRouteContext } from "@/lib/api/route-context";
import { mapDisposition } from "@/lib/dispositions-mapper";
import { getClientEmailProvider } from "@/lib/notifications/email-provider";
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

/** Manager approves ready/deny → send deferred client email. */
export async function POST(_request: Request, context: IdRouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createAdminClient();

    const { data: row, error: loadError } = await supabase
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
      .eq("id", id)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json(
        { error: "Disposition not found." },
        { status: 404 }
      );
    }

    if (row.notification_status !== "pending_sign_off") {
      return NextResponse.json(
        { error: "This disposition is not awaiting sign-off." },
        { status: 400 }
      );
    }

    if (
      row.decision !== "ready_for_sign_off" &&
      row.decision !== "denied"
    ) {
      return NextResponse.json(
        {
          error:
            "Only ready-for-sign-off and deny decisions require manager sign-off.",
        },
        { status: 400 }
      );
    }

    const review = Array.isArray(row.reviews) ? row.reviews[0] : row.reviews;
    if (!review) {
      return NextResponse.json(
        { error: "Review not found for disposition." },
        { status: 404 }
      );
    }

    const disposition = mapDisposition(row);
    const notify = await getClientEmailProvider().notifyClient({
      reviewId: review.id,
      businessName: review.business_name,
      decision: disposition.decision,
      note: disposition.note,
      findings: disposition.findingSnapshot,
    });

    const { data: updated, error: updateError } = await supabase
      .from("review_dispositions")
      .update({
        notification_provider: notify.provider,
        notification_message_id: notify.messageId,
        notification_status: notify.status,
        notification_summary: notify.summary,
      })
      .eq("id", id)
      .select(DISPOSITION_SELECT)
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Failed to update disposition." },
        { status: 500 }
      );
    }

    let reviewStatus = review.status as ReviewStatus;
    if (disposition.decision === "ready_for_sign_off") {
      const { error: statusError } = await supabase
        .from("reviews")
        .update({ status: "signed_off" })
        .eq("id", review.id);

      if (statusError) {
        return NextResponse.json(
          { error: statusError.message },
          { status: 500 }
        );
      }
      reviewStatus = "signed_off";
    }

    return NextResponse.json({
      disposition: mapDisposition(updated),
      reviewStatus,
      notification: notify,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sign off disposition";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
