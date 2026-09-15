"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReviews } from "@/hooks/use-reviews";
import {
  getFindingSeverityBadgeVariant,
  getFindingStatusLabel,
  getFindingTypeLabel,
  type Finding,
  type FindingStatus,
} from "@/lib/findings";
import { fetchJson, getErrorMessage } from "@/lib/http";
import { getReviewStatusLabel, type ReviewStatus } from "@/lib/reviews";
import {
  buildCompletenessRows,
  getCompletenessStatusLabel,
} from "@/lib/underwriting/completeness";
import {
  EXPECTED_DOCUMENTS,
  detectDocumentKind,
} from "@/lib/underwriting/checklist";

type FindingsResponse = {
  findings: Finding[];
};

type AnalyzeResponse = {
  findings: Finding[];
  reviewStatus?: ReviewStatus;
};

type FindingUpdateResponse = {
  finding: Finding;
};

export function DocumentReviewWorkspace() {
  const {
    reviews,
    setReviews,
    loading,
    error,
    setError,
  } = useReviews();
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === selectedReviewId) ?? null,
    [reviews, selectedReviewId]
  );

  useEffect(() => {
    if (!selectedReviewId && reviews[0]) {
      setSelectedReviewId(reviews[0].id);
    }
  }, [reviews, selectedReviewId]);

  const loadFindings = useCallback(async (reviewId: string) => {
    const payload = await fetchJson<FindingsResponse>(
      `/api/reviews/${reviewId}/findings`
    );
    setFindings(payload.findings ?? []);
  }, []);

  useEffect(() => {
    if (!selectedReviewId) {
      setFindings([]);
      return;
    }
    void loadFindings(selectedReviewId).catch((loadError: unknown) => {
      setError(getErrorMessage(loadError, "Failed to load findings."));
    });
  }, [selectedReviewId, loadFindings, setError]);

  const completeness = useMemo(
    () => buildCompletenessRows(selectedReview, findings),
    [selectedReview, findings]
  );

  async function runAnalysis() {
    if (!selectedReviewId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const payload = await fetchJson<AnalyzeResponse>(
        `/api/reviews/${selectedReviewId}/analyze`,
        { method: "POST" }
      );
      setFindings(payload.findings ?? []);
      if (payload.reviewStatus) {
        setReviews((current) =>
          current.map((review) =>
            review.id === selectedReviewId
              ? { ...review, status: payload.reviewStatus! }
              : review
          )
        );
      }
    } catch (runError) {
      setError(getErrorMessage(runError, "Analysis failed."));
    } finally {
      setAnalyzing(false);
    }
  }

  async function updateFindingStatus(findingId: string, status: FindingStatus) {
    setUpdatingId(findingId);
    setError(null);
    try {
      const payload = await fetchJson<FindingUpdateResponse>(
        `/api/findings/${findingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      setFindings((current) =>
        current.map((finding) =>
          finding.id === findingId ? payload.finding : finding
        )
      );
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Failed to update finding."));
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading reviews…</p>;
  }

  if (reviews.length === 0) {
    return (
      <Alert>
        <AlertTitle>No reviews yet</AlertTitle>
        <AlertDescription>
          Create a review with documents in Document Queue, then return here to
          run stub analysis.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Document Review</CardTitle>
          <CardDescription>
            Commercial package POC: stub analysis checks packet completeness and
            cross-document consistency. Swap in an LLM provider later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-(--card-spacing)">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium" htmlFor="review-select">
              Review
            </label>
            <select
              id="review-select"
              className="h-8 min-w-56 rounded-md border border-input bg-background px-2 text-xs"
              value={selectedReviewId ?? ""}
              onChange={(event) => setSelectedReviewId(event.target.value)}
            >
              {reviews.map((review) => (
                <option key={review.id} value={review.id}>
                  {review.businessName} ({getReviewStatusLabel(review.status)})
                </option>
              ))}
            </select>
            <Button
              onClick={() => void runAnalysis()}
              disabled={!selectedReviewId || analyzing}
            >
              {analyzing ? "Running…" : "Run stub analysis"}
            </Button>
          </div>

          {selectedReview ? (
            <div className="flex flex-wrap gap-2">
              {EXPECTED_DOCUMENTS.map((doc) => {
                const present = selectedReview.documents.some(
                  (item) => detectDocumentKind(item.fileName) === doc.kind
                );
                return (
                  <Badge key={doc.kind} variant={present ? "default" : "outline"}>
                    {doc.label}: {present ? "found" : "missing"}
                  </Badge>
                );
              })}
            </div>
          ) : null}

          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Completeness checklist</CardTitle>
          <CardDescription>
            Required underwriting fields for commercial package submissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-(--card-spacing)">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completeness.map(({ field, status }) => (
                <TableRow key={field.key}>
                  <TableCell className="font-medium">{field.label}</TableCell>
                  <TableCell>{field.required ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getCompletenessStatusLabel(status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Findings</CardTitle>
          <CardDescription>
            Accept or reject each item for the human-in-the-loop trail.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-(--card-spacing)">
          {findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No findings yet. Run stub analysis to generate packet insights.
            </p>
          ) : (
            findings.map((finding) => (
              <div
                key={finding.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{finding.title}</span>
                  <Badge
                    variant={getFindingSeverityBadgeVariant(finding.severity)}
                  >
                    {finding.severity}
                  </Badge>
                  <Badge variant="outline">
                    {getFindingTypeLabel(finding.type)}
                  </Badge>
                  <Badge variant="secondary">
                    {getFindingStatusLabel(finding.status)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{finding.summary}</p>
                {finding.suggestedAction ? (
                  <p className="text-xs">
                    <span className="font-medium">Next step: </span>
                    {finding.suggestedAction}
                  </p>
                ) : null}
                {finding.evidence.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {finding.evidence.map((item) => (
                      <li key={item.id}>
                        {item.pageNumber ? `p.${item.pageNumber}: ` : null}
                        {item.snippet}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {finding.status === "open" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={updatingId === finding.id}
                      onClick={() =>
                        void updateFindingStatus(finding.id, "accepted")
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingId === finding.id}
                      onClick={() =>
                        void updateFindingStatus(finding.id, "rejected")
                      }
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
