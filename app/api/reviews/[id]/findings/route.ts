import { NextResponse } from "next/server";
import { mapFinding } from "@/lib/findings-mapper";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createAdminClient();

    const { data: findings, error } = await supabase
      .from("findings")
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
      .eq("review_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      findings: (findings ?? []).map(mapFinding),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load findings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
