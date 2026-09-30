"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CompleteReviewDialog } from "@/components/complete-review-dialog";
import { useReviews } from "@/hooks/use-reviews";
import {
  formatEvidenceCitation,
  getFindingSeverityBadgeVariant,
  getFindingSeverityLabel,
  getFindingStatusLabel,
  getFindingTypeLabel,
  resolveEvidenceDocumentLabel,
  type Finding,
  type FindingStatus,
} from "@/lib/findings";
import { fetchJson, getErrorMessage } from "@/lib/http";
import { getReviewStatusBadgeVariant, getReviewStatusLabel, type ReviewStatus } from "@/lib/reviews";
import {
  buildCompletenessRows,
  getCompletenessStatusLabel,
} from "@/lib/underwriting/completeness";
import {
  EXPECTED_DOCUMENTS,
  detectDocumentKind,
} from "@/lib/underwriting/checklist";
import { getDashboardHref } from "@/lib/workspace-tabs";
import { cn } from "cn";

type AnalyzeResponse = {
  findings: Finding[];
  reviewStatus?: ReviewStatus;
};

type FindingUpdateResponse = {
  finding: Finding;
};

export function DocumentReviewWorkspace() {
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("review");
  const {
    reviews,
    setReviews,
    loading,
    error,
    setError,
  } = useReviews();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [disagreeingId, setDisagreeingId] = useState<string | null>(null);
  const [disagreementReason, setDisagreementReason] = useState("");
  const [disagreeError, setDisagreeError] = useState<string | null>(null);
  const autoAnalyzedReviewIdRef = useRef<string | null>(null);

  const selectedReview = useMemo(
    () => reviews.find((review) => review.id === reviewId) ?? null,
    [reviews, reviewId]
  );
  const selectedReviewId = selectedReview?.id ?? null;
  const documentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const document of selectedReview?.documents ?? []) {
      map.set(document.id, document.fileName);
    }
    return map;
  }, [selectedReview]);

  const runAnalysis = useCallback(async () => {
    if (!reviewId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const payload = await fetchJson<AnalyzeResponse>(
        `/api/reviews/${reviewId}/analyze`,
        { method: "POST" }
      );
      setFindings(payload.findings ?? []);
      if (payload.reviewStatus) {
        setReviews((current) =>
          current.map((review) =>
            review.id === reviewId
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
  }, [reviewId, setError, setReviews]);

  useEffect(() => {
    if (!reviewId || !selectedReviewId) {
      setFindings([]);
      autoAnalyzedReviewIdRef.current = null;
      return;
    }

    if (autoAnalyzedReviewIdRef.current === reviewId) {
      return;
    }

    autoAnalyzedReviewIdRef.current = reviewId;
    setDisagreeingId(null);
    setDisagreementReason("");
    setDisagreeError(null);
    void runAnalysis();
  }, [reviewId, selectedReviewId, runAnalysis]);

  const completeness = useMemo(
    () => buildCompletenessRows(selectedReview, findings),
    [selectedReview, findings]
  );
  const findingsReviewedCount = useMemo(
    () => findings.filter((finding) => finding.status !== "open").length,
    [findings]
  );
  const expectedDocumentPresence = useMemo(() => {
    if (!selectedReview) return [];
    return EXPECTED_DOCUMENTS.map((doc) => ({
      ...doc,
      present: selectedReview.documents.some(
        (item) => detectDocumentKind(item.fileName) === doc.kind
      ),
    }));
  }, [selectedReview]);
  const missingExpectedDocuments = useMemo(
    () => expectedDocumentPresence.filter((doc) => !doc.present),
    [expectedDocumentPresence]
  );

  async function updateFindingStatus(
    findingId: string,
    status: FindingStatus,
    options?: { disagreementReason?: string }
  ) {
    setUpdatingId(findingId);
    setError(null);
    try {
      const payload = await fetchJson<FindingUpdateResponse>(
        `/api/findings/${findingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            disagreementReason: options?.disagreementReason,
          }),
        }
      );
      setFindings((current) =>
        current.map((finding) =>
          finding.id === findingId ? payload.finding : finding
        )
      );
      if (status === "disagreed") {
        setDisagreeingId(null);
        setDisagreementReason("");
        setDisagreeError(null);
      }
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Failed to update finding."));
    } finally {
      setUpdatingId(null);
    }
  }

  function startDisagree(findingId: string) {
    setDisagreeingId(findingId);
    setDisagreementReason("");
    setDisagreeError(null);
  }

  function cancelDisagree() {
    setDisagreeingId(null);
    setDisagreementReason("");
    setDisagreeError(null);
  }

  function confirmDisagree(findingId: string) {
    const reason = disagreementReason.trim();
    if (!reason) {
      setDisagreeError(
        "Add a short reason for disagreeing with this suggestion."
      );
      return;
    }
    void updateFindingStatus(findingId, "disagreed", {
      disagreementReason: reason,
    });
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading review…</p>;
  }

  if (!reviewId) {
    return (
      <Alert>
        <AlertTitle>No review selected</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>
            Open a packet from the Dashboard to start document review.
          </span>
          <Link
            href={getDashboardHref()}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-fit"
            )}
          >
            Back to Dashboard
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (!selectedReview) {
    return (
      <Alert>
        <AlertTitle>Review not found</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>
            That review is missing or was removed. Pick another packet from the
            Dashboard.
          </span>
          <Link
            href={getDashboardHref()}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-fit"
            )}
          >
            Back to Dashboard
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-card px-4 py-3 shadow-header">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-medium">
                {selectedReview.businessName}
              </h2>
              <Badge variant={getReviewStatusBadgeVariant(selectedReview.status)}>
                {getReviewStatusLabel(selectedReview.status)}
              </Badge>
            </div>
            {missingExpectedDocuments.length === 0 ? (
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="success">All documents present</Badge>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">
                  {expectedDocumentPresence.length -
                    missingExpectedDocuments.length}
                  /{expectedDocumentPresence.length} documents
                </Badge>
                {missingExpectedDocuments.map((doc) => (
                  <Badge key={doc.kind} variant="warning">
                    Missing {doc.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={getDashboardHref()}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Back to Dashboard
            </Link>
            <CompleteReviewDialog
              review={selectedReview}
              findings={findings}
              onDisposed={(reviewStatus) => {
                setReviews((current) =>
                  current.map((review) =>
                    review.id === selectedReview.id
                      ? { ...review, status: reviewStatus }
                      : review
                  )
                );
              }}
            />
          </div>
        </div>
      </div>

      {selectedReview.status === "returned_for_review" &&
      selectedReview.returnReason ? (
        <Alert className="border-warning-border bg-warning-bg text-warning-foreground">
          <AlertTitle>Returned for re-review</AlertTitle>
          <AlertDescription className="text-warning-foreground">
            {selectedReview.returnReason}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Commercial package review — stub analysis checks packet completeness
          and cross-document consistency.
        </p>
        <Button
          variant="link"
          size="sm"
          className="h-auto px-0"
          disabled={analyzing}
          onClick={() => void runAnalysis()}
        >
          {analyzing ? "Running analysis…" : "Re-run stub analysis"}
        </Button>
      </div>

      {analyzing && findings.length === 0 ? (
        <p className="text-xs text-muted-foreground">Running stub analysis…</p>
      ) : null}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Accordion
        defaultValue={[]}
        className="rounded-lg border border-border bg-card text-card-foreground"
      >
        <AccordionItem
          value="completeness"
          className="border-0 data-open:bg-transparent"
        >
          <AccordionTrigger className="px-4 py-4 hover:no-underline">
            <span className="flex flex-col gap-1 text-left">
              <span className="font-heading text-sm font-medium">
                Completeness checklist
              </span>
              <span className="text-xs/relaxed font-normal text-muted-foreground">
                Required underwriting fields for commercial package submissions.
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Findings</CardTitle>
          <CardDescription>
            Mark whether you agree with each AI suggestion. Disagree requires a
            short reason so we can improve the model.
          </CardDescription>
          {findings.length > 0 ? (
            <CardAction>
              <span className="text-xs text-muted-foreground tabular-nums">
                {findingsReviewedCount} of {findings.length} reviewed
              </span>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-(--card-spacing)">
          {findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No findings yet. Run stub analysis to generate packet insights.
            </p>
          ) : (
            findings.map((finding) => (
              <div
                key={finding.id}
                className="flex flex-col gap-1.5 rounded-lg border border-border px-2.5 py-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium">
                        {finding.title}
                      </span>
                      <Badge
                        variant={getFindingSeverityBadgeVariant(
                          finding.severity
                        )}
                      >
                        {getFindingSeverityLabel(finding.severity)}
                      </Badge>
                      <Badge variant="outline">
                        {getFindingTypeLabel(finding.type)}
                      </Badge>
                      <Badge variant="secondary">
                        {getFindingStatusLabel(finding.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {finding.summary}
                    </p>
                    {finding.suggestedAction ? (
                      <p className="text-xs">
                        <span className="font-medium">Next step: </span>
                        {finding.suggestedAction}
                      </p>
                    ) : null}
                    {finding.evidence.length > 0 ? (
                      <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                        {finding.evidence.map((item) => (
                          <li key={item.id}>
                            {formatEvidenceCitation(
                              item,
                              resolveEvidenceDocumentLabel(
                                item,
                                documentNameById
                              )
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {finding.status === "disagreed" &&
                    finding.disagreementReason ? (
                      <p className="text-xs">
                        <span className="font-medium">
                          Disagreement reason:{" "}
                        </span>
                        {finding.disagreementReason}
                      </p>
                    ) : null}
                  </div>
                  {finding.status === "open" &&
                  disagreeingId !== finding.id ? (
                    <div className="flex shrink-0 gap-1.5">
                      <Button
                        size="sm"
                        variant="success"
                        disabled={updatingId === finding.id}
                        onClick={() =>
                          void updateFindingStatus(finding.id, "agreed")
                        }
                      >
                        Agree
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === finding.id}
                        onClick={() => startDisagree(finding.id)}
                      >
                        Disagree
                      </Button>
                    </div>
                  ) : null}
                </div>
                {finding.status === "open" &&
                disagreeingId === finding.id ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`disagree-reason-${finding.id}`}>
                        Why do you disagree?
                      </Label>
                      <Textarea
                        id={`disagree-reason-${finding.id}`}
                        value={disagreementReason}
                        onChange={(event) => {
                          setDisagreementReason(event.target.value);
                          if (disagreeError) setDisagreeError(null);
                        }}
                        placeholder="e.g. Limits match the schedule on page 2 of the SOV."
                        disabled={updatingId === finding.id}
                        aria-invalid={Boolean(disagreeError)}
                      />
                      {disagreeError ? (
                        <p className="text-xs text-destructive" role="alert">
                          {disagreeError}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updatingId === finding.id}
                        onClick={() => confirmDisagree(finding.id)}
                      >
                        {updatingId === finding.id
                          ? "Saving…"
                          : "Confirm disagree"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === finding.id}
                        onClick={cancelDisagree}
                      >
                        Cancel
                      </Button>
                    </div>
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
