import { NextResponse } from "next/server";
import type { IdRouteContext } from "@/lib/api/route-context";
import { recommendDisposition } from "@/lib/analysis/stub-disposition";
import {
  DISPOSITION_DECISIONS,
  buildFindingSnapshot,
  dispositionDecisionToReviewStatus,
  type DispositionDecision,
} from "@/lib/dispositions";
import { mapDisposition } from "@/lib/dispositions-mapper";
import {
  FINDING_SEVERITIES,
  FINDING_STATUSES,
  FINDING_TYPES,
  type Finding,
  type FindingSeverity,
  type FindingStatus,
  type FindingType,
} from "@/lib/findings";
import { getClientEmailProvider } from "@/lib/notifications/email-provider";
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

function isFindingType(value: unknown): value is FindingType {
  return typeof value === "string" && FINDING_TYPES.includes(value as FindingType);
}

function isFindingSeverity(value: unknown): value is FindingSeverity {
  return (
    typeof value === "string" &&
    FINDING_SEVERITIES.includes(value as FindingSeverity)
  );
}

function isFindingStatus(value: unknown): value is FindingStatus {
  return (
    typeof value === "string" && FINDING_STATUSES.includes(value as FindingStatus)
  );
}

function parseFindings(value: unknown): Finding[] | null {
  if (!Array.isArray(value)) return null;

  const findings: Finding[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const row = item as Partial<Finding>;
    if (
      typeof row.id !== "string" ||
      typeof row.title !== "string" ||
      typeof row.summary !== "string" ||
      !isFindingType(row.type) ||
      !isFindingSeverity(row.severity) ||
      !isFindingStatus(row.status)
    ) {
      return null;
    }

    findings.push({
      id: row.id,
      reviewId: typeof row.reviewId === "string" ? row.reviewId : "",
      analysisRunId:
        typeof row.analysisRunId === "string" ? row.analysisRunId : "",
      type: row.type,
      severity: row.severity,
      status: row.status,
      fieldKey: typeof row.fieldKey === "string" ? row.fieldKey : null,
      title: row.title,
      summary: row.summary,
      suggestedAction:
        typeof row.suggestedAction === "string" ? row.suggestedAction : null,
      expectedValue:
        typeof row.expectedValue === "string" ? row.expectedValue : null,
      observedValues: Array.isArray(row.observedValues)
        ? row.observedValues.filter((v): v is string => typeof v === "string")
        : [],
      confidence: typeof row.confidence === "number" ? row.confidence : null,
      disagreementReason:
        typeof row.disagreementReason === "string"
          ? row.disagreementReason
          : null,
      evidence: [],
      createdAt: typeof row.createdAt === "string" ? row.createdAt : "",
      updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : "",
    });
  }

  return findings;
}

export async function POST(request: Request, context: IdRouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      decision?: DispositionDecision;
      note?: string;
      findings?: unknown;
    };

    if (!body.decision || !DISPOSITION_DECISIONS.includes(body.decision)) {
      return NextResponse.json(
        { error: "A valid disposition decision is required." },
        { status: 400 }
      );
    }

    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (body.decision !== "ready_for_sign_off" && !note) {
      return NextResponse.json(
        { error: "A note is required for this decision." },
        { status: 400 }
      );
    }

    const findings = parseFindings(body.findings ?? []);
    if (!findings) {
      return NextResponse.json(
        { error: "Findings payload is invalid." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, business_name, status")
      .eq("id", id)
      .maybeSingle();

    if (reviewError) {
      return NextResponse.json(
        { error: reviewError.message },
        { status: 500 }
      );
    }

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const findingSnapshot = buildFindingSnapshot(findings, body.decision);
    const nextStatus = dispositionDecisionToReviewStatus(body.decision);
    const aiRecommendation = recommendDisposition(findings);

    // Split gate: info requests notify now; ready/deny wait for manager sign-off.
    let notification = {
      provider: "stub",
      messageId: null as string | null,
      status: "pending_sign_off",
      summary: "Client email held until manager sign-off.",
    };

    if (body.decision === "awaiting_client") {
      const notify = await getClientEmailProvider().notifyClient({
        reviewId: review.id,
        businessName: review.business_name,
        decision: body.decision,
        note: note || null,
        findings: findingSnapshot,
      });
      notification = {
        provider: notify.provider,
        messageId: notify.messageId,
        status: notify.status,
        summary: notify.summary,
      };
    }

    const { data: disposition, error: dispositionError } = await supabase
      .from("review_dispositions")
      .insert({
        review_id: id,
        decision: body.decision,
        note: note || null,
        finding_snapshot: findingSnapshot,
        ai_recommended_decision: aiRecommendation.decision,
        ai_recommendation_summary: aiRecommendation.summary,
        ai_recommendation_rationale: aiRecommendation.rationale,
        ai_recommendation_confidence: aiRecommendation.confidence,
        notification_provider: notification.provider,
        notification_message_id: notification.messageId,
        notification_status: notification.status,
        notification_summary: notification.summary,
      })
      .select(DISPOSITION_SELECT)
      .single();

    if (dispositionError || !disposition) {
      return NextResponse.json(
        {
          error:
            dispositionError?.message ?? "Failed to save review disposition.",
        },
        { status: 500 }
      );
    }

    const { error: statusError } = await supabase
      .from("reviews")
      .update({ status: nextStatus })
      .eq("id", id);

    if (statusError) {
      return NextResponse.json(
        { error: statusError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      disposition: mapDisposition(disposition),
      reviewStatus: nextStatus,
      notification,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to dispose review";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
