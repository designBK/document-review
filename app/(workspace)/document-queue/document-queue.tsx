"use client";

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
import { useReviews } from "@/hooks/use-reviews";
import { getReviewStatusLabel } from "@/lib/reviews";

export function DocumentQueue() {
  const { reviews, loading, error } = useReviews({ listenForChanges: true });

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
