"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { recommendDisposition } from "@/lib/analysis/stub-disposition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DISPOSITION_DECISIONS,
  getDispositionDecisionLabel,
  type DispositionDecision,
} from "@/lib/dispositions";
import type { Finding } from "@/lib/findings";
import { fetchJson, getErrorMessage } from "@/lib/http";
import {
  notifyReviewsChanged,
  type Review,
  type ReviewStatus,
} from "@/lib/reviews";
import {
  getDocumentReadinessHref,
} from "@/lib/workspace-tabs";

type DisposeResponse = {
  reviewStatus: ReviewStatus;
};

type DecisionChoice = "use_ai" | DispositionDecision;

type CompleteReviewDialogProps = {
  review: Review | null;
  findings: Finding[];
  onDisposed: (reviewStatus: ReviewStatus) => void;
};

function buildDispositionNote(
  decision: DispositionDecision,
  aiItems: string[],
  additionalNote: string
) {
  const extra = additionalNote.trim();
  const sections: string[] = [];

  if (decision === "awaiting_client") {
    if (aiItems.length > 0) {
      sections.push(
        `Requested information:\n${aiItems.map((item) => `- ${item}`).join("\n")}`
      );
    }
    if (extra) {
      sections.push(`Additional underwriter notes:\n${extra}`);
    }
  } else if (decision === "denied") {
    if (aiItems.length > 0) {
      sections.push(
        `Denial reasons:\n${aiItems.map((item) => `- ${item}`).join("\n")}`
      );
    }
    if (extra) {
      sections.push(`Additional underwriter reasoning:\n${extra}`);
    }
  } else if (extra) {
    sections.push(extra);
  }

  return sections.join("\n\n");
}

export function CompleteReviewDialog({
  review,
  findings,
  onDisposed,
}: CompleteReviewDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<DecisionChoice>("use_ai");
  const [additionalNote, setAdditionalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommendation = useMemo(
    () => recommendDisposition(findings),
    [findings]
  );

  const effectiveDecision: DispositionDecision =
    choice === "use_ai" ? recommendation.decision : choice;

  const followsAi = choice === "use_ai";
  const confirmationItems =
    effectiveDecision === "awaiting_client"
      ? recommendation.requestedItems
      : effectiveDecision === "denied"
        ? recommendation.denialReasons
        : [];

  function reset() {
    setChoice("use_ai");
    setAdditionalNote("");
    setError(null);
  }

  async function handleSubmit() {
    if (!review) return;

    const note = buildDispositionNote(
      effectiveDecision,
      confirmationItems,
      additionalNote
    );

    if (effectiveDecision !== "ready_for_sign_off" && !note.trim()) {
      setError(
        effectiveDecision === "denied"
          ? "Add denial reasoning, or ensure AI denial reasons are present."
          : "Add what to request from the client, or ensure AI request items are present."
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = await fetchJson<DisposeResponse>(
        `/api/reviews/${review.id}/dispose`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: effectiveDecision,
            note,
            findings,
          }),
        }
      );

      onDisposed(payload.reviewStatus);
      notifyReviewsChanged();
      setOpen(false);
      reset();

      if (effectiveDecision === "awaiting_client") {
        router.push(getDocumentReadinessHref({ notice: "awaiting-client" }));
      } else {
        router.push(getDocumentReadinessHref({ notice: "sent-to-sign-off" }));
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Failed to complete review."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return;
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger render={<Button disabled={!review} />}>
        Complete review
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>Complete review</DialogTitle>
          <DialogDescription>
            Review the AI recommendation for{" "}
            {review ? `“${review.businessName}”` : "this review"}, then confirm
            or override the outcome. Final authority stays with the underwriter.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-medium">AI recommendation</h3>
              <Badge variant="secondary">
                {getDispositionDecisionLabel(recommendation.decision)}
              </Badge>
              <Badge variant="outline">
                {Math.round(recommendation.confidence * 100)}% confidence
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {recommendation.summary}
            </p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {recommendation.rationale.map((item, index) => (
                <li key={`rationale-${index}`}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-1.5">
            <Label htmlFor="disposition-choice">Decision</Label>
            <select
              id="disposition-choice"
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              value={choice}
              disabled={submitting}
              onChange={(event) => {
                setChoice(event.target.value as DecisionChoice);
                setError(null);
              }}
            >
              <option value="use_ai">
                Use AI suggestion (
                {getDispositionDecisionLabel(recommendation.decision)})
              </option>
              {DISPOSITION_DECISIONS.map((value) => (
                <option key={value} value={value}>
                  Override: {getDispositionDecisionLabel(value)}
                </option>
              ))}
            </select>
            {!followsAi ? (
              <p className="text-xs text-muted-foreground">
                Overriding AI suggestion of “
                {getDispositionDecisionLabel(recommendation.decision)}”.
              </p>
            ) : null}
          </section>

          <section className="flex flex-col gap-2 rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-medium">Confirm disposition</h3>
              <Badge variant="outline">
                {getDispositionDecisionLabel(effectiveDecision)}
              </Badge>
            </div>

            {effectiveDecision === "ready_for_sign_off" ? (
              <p className="text-xs text-muted-foreground">
                Packet will move to manager sign-off. No additional client
                information is requested.
              </p>
            ) : null}

            {effectiveDecision === "awaiting_client" ? (
              <div className="flex flex-col gap-2">
                <div>
                  <p className="mb-1 text-xs font-medium">
                    Information AI recommends requesting
                  </p>
                  {confirmationItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No specific request items from findings. Add underwriter
                      notes below.
                    </p>
                  ) : (
                    <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {confirmationItems.map((item, index) => (
                        <li key={`request-${index}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="additional-request-note">
                    Additional information to request
                  </Label>
                  <Textarea
                    id="additional-request-note"
                    value={additionalNote}
                    disabled={submitting}
                    onChange={(event) => {
                      setAdditionalNote(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Optional: anything else the client should provide."
                  />
                </div>
              </div>
            ) : null}

            {effectiveDecision === "denied" ? (
              <div className="flex flex-col gap-2">
                <div>
                  <p className="mb-1 text-xs font-medium">
                    AI reasons for denial
                  </p>
                  {confirmationItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No structured denial reasons from findings. Add
                      underwriter reasoning below.
                    </p>
                  ) : (
                    <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {confirmationItems.map((item, index) => (
                        <li key={`denial-${index}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="additional-denial-note">
                    Additional underwriter reasoning
                  </Label>
                  <Textarea
                    id="additional-denial-note"
                    value={additionalNote}
                    disabled={submitting}
                    onChange={(event) => {
                      setAdditionalNote(event.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Add context for the manager and client notification."
                  />
                </div>
              </div>
            ) : null}
          </section>

          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting || !review}
            onClick={() => void handleSubmit()}
          >
            {submitting ? "Saving…" : "Confirm disposition"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
