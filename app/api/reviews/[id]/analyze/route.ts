import { NextResponse } from "next/server";
import { runStubAnalysis } from "@/lib/analysis/stub-provider";
import type { IdRouteContext } from "@/lib/api/route-context";
import { mapAnalysisRun, mapFinding } from "@/lib/findings-mapper";
import { mapReview } from "@/lib/reviews-mapper";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, context: IdRouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createAdminClient();

    const { data: reviewRow, error: reviewError } = await supabase
      .from("reviews")
      .select(
        `
        id,
        business_name,
        status,
        created_at,
        updated_at,
        documents (
          id,
          file_name,
          mime_type,
          size_bytes,
          storage_path,
          created_at
        )
      `
      )
      .eq("id", id)
      .single();

    if (reviewError || !reviewRow) {
      return NextResponse.json(
        { error: reviewError?.message ?? "Review not found." },
        { status: 404 }
      );
    }

    const review = mapReview(reviewRow);
    if (review.documents.length === 0) {
      return NextResponse.json(
        { error: "Upload documents before running analysis." },
        { status: 400 }
      );
    }

    const { data: run, error: runError } = await supabase
      .from("analysis_runs")
      .insert({
        review_id: id,
        provider: "stub",
        status: "pending",
      })
      .select("id, review_id, provider, status, summary, started_at, completed_at")
      .single();

    if (runError || !run) {
      return NextResponse.json(
        { error: runError?.message ?? "Failed to start analysis." },
        { status: 500 }
      );
    }

    try {
      const drafts = runStubAnalysis(review);

      const findingRows = drafts.map((draft) => ({
        id: crypto.randomUUID(),
        review_id: id,
        analysis_run_id: run.id,
        type: draft.type,
        severity: draft.severity,
        status: "open" as const,
        field_key: draft.fieldKey,
        title: draft.title,
        summary: draft.summary,
        suggested_action: draft.suggestedAction,
        expected_value: draft.expectedValue,
        observed_values: draft.observedValues,
        confidence: draft.confidence,
      }));

      const { error: findingsError } = await supabase
        .from("findings")
        .insert(findingRows);

      if (findingsError) {
        throw new Error(findingsError.message ?? "Failed to save findings.");
      }

      const evidenceRows = findingRows.flatMap((finding, index) => {
        const draft = drafts[index];
        return draft.evidence.map((item) => ({
          finding_id: finding.id,
          document_id: item.documentId,
          page_number: item.pageNumber,
          snippet: item.snippet,
        }));
      });

      if (evidenceRows.length > 0) {
        const { error: evidenceError } = await supabase
          .from("finding_evidence")
          .insert(evidenceRows);
        if (evidenceError) {
          throw new Error(evidenceError.message);
        }
      }

      const hasBlockers = drafts.some((draft) => draft.severity === "blocker");
      const nextStatus = hasBlockers ? "issues_found" : "under_review";

      await supabase
        .from("reviews")
        .update({ status: nextStatus })
        .eq("id", id);

      const summary = `Stub analysis produced ${drafts.length} finding(s).`;
      const { data: completedRun, error: completeError } = await supabase
        .from("analysis_runs")
        .update({
          status: "completed",
          summary,
          completed_at: new Date().toISOString(),
        })
        .eq("id", run.id)
        .select(
          "id, review_id, provider, status, summary, started_at, completed_at"
        )
        .single();

      if (completeError || !completedRun) {
        throw new Error(completeError?.message ?? "Failed to complete analysis.");
      }

      const { data: findingsWithEvidence, error: reloadError } = await supabase
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
          disagreement_reason,
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
        .eq("analysis_run_id", run.id)
        .order("created_at", { ascending: true });

      if (reloadError) {
        throw new Error(reloadError.message);
      }

      return NextResponse.json({
        analysisRun: mapAnalysisRun(completedRun),
        findings: (findingsWithEvidence ?? []).map(mapFinding),
        reviewStatus: nextStatus,
      });
    } catch (error) {
      await supabase
        .from("analysis_runs")
        .update({
          status: "failed",
          summary:
            error instanceof Error ? error.message : "Analysis failed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", run.id);

      const message =
        error instanceof Error ? error.message : "Failed to run analysis";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run analysis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
