import { NextResponse } from "next/server";
import type { IdRouteContext } from "@/lib/api/route-context";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_REASON_LENGTH = 2000;

/** Manager sends a ready or deny packet back to the underwriter. */
export async function POST(request: Request, context: IdRouteContext) {
  try {
    const { id } = await context.params;
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }

    const reason =
      payload &&
      typeof payload === "object" &&
      "reason" in payload &&
      typeof payload.reason === "string"
        ? payload.reason.trim()
        : "";

    if (!reason) {
      return NextResponse.json(
        { error: "A reason for re-review is required." },
        { status: 400 }
      );
    }

    if (reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: "Reason must be 2000 characters or fewer." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: row, error: loadError } = await supabase
      .from("review_dispositions")
      .select("id, review_id, decision, notification_status")
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

    if (row.decision !== "ready_for_sign_off" && row.decision !== "denied") {
      return NextResponse.json(
        {
          error:
            "Only ready-for-sign-off and deny decisions can be returned for re-review.",
        },
        { status: 400 }
      );
    }

    const returnedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("review_dispositions")
      .update({
        return_reason: reason,
        returned_at: returnedAt,
        notification_status: "returned_for_review",
        notification_summary: "Returned to the underwriter for re-review.",
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error: statusError } = await supabase
      .from("reviews")
      .update({ status: "returned_for_review" })
      .eq("id", row.review_id);

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }

    return NextResponse.json({
      reviewId: row.review_id,
      reviewStatus: "returned_for_review",
      returnReason: reason,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to return packet for re-review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
