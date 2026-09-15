import { NextResponse } from "next/server";
import {
  FINDING_STATUSES,
  type FindingStatus,
} from "@/lib/findings";
import { mapFinding } from "@/lib/findings-mapper";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: FindingStatus;
      summary?: string;
    };

    if (!body.status || !FINDING_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: "A valid finding status is required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const updates: {
      status: FindingStatus;
      summary?: string;
    } = {
      status: body.status,
    };

    if (typeof body.summary === "string" && body.summary.trim()) {
      updates.summary = body.summary.trim();
    }

    const { data, error } = await supabase
      .from("findings")
      .update(updates)
      .eq("id", id)
      .select(
        `
        id,
        review_id,
        analysis_run_id,
        type,
        severity,
        status,
        field_key,
        title,
        summary,
        suggested_action,
        expected_value,
        observed_values,
        confidence,
        created_at,
        updated_at,
        finding_evidence (
          id,
          finding_id,
          document_id,
          page_number,
          snippet,
          created_at
        )
      `
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Finding not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ finding: mapFinding(data) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update finding";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
