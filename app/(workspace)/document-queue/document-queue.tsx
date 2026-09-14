"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  REVIEWS_CHANGED_EVENT,
  getReviewStatusLabel,
  type Review,
} from "@/lib/reviews";

export function DocumentQueue() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/reviews");
      const payload = (await response.json()) as {
        reviews?: Review[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load reviews.");
      }

      setReviews(payload.reviews ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load reviews."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();

    function handleReviewsChanged() {
      void loadReviews();
    }

    window.addEventListener(REVIEWS_CHANGED_EVENT, handleReviewsChanged);
    return () => {
      window.removeEventListener(REVIEWS_CHANGED_EVENT, handleReviewsChanged);
    };
  }, [loadReviews]);

  return (
    <Table>
      <TableCaption>
        {loading
          ? "Loading reviews…"
          : error
            ? error
            : reviews.length === 0
              ? "No reviews yet. Create one with New review."
              : `${reviews.length} review${reviews.length === 1 ? "" : "s"} in queue`}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Business title</TableHead>
          <TableHead>Documents</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={3} className="text-muted-foreground">
              Loading…
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={3} className="text-destructive">
              {error}
            </TableCell>
          </TableRow>
        ) : reviews.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-muted-foreground">
              No created reviews to display.
            </TableCell>
          </TableRow>
        ) : (
          reviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell className="font-medium">
                {review.businessName}
              </TableCell>
              <TableCell>
                <div className="flex max-w-md flex-wrap gap-1">
                  {review.documents.map((document) => (
                    <Badge key={document.id} variant="outline">
                      {document.fileName}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {getReviewStatusLabel(review.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
