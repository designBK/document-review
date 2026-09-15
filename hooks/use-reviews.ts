"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson, getErrorMessage } from "@/lib/http";
import {
  REVIEWS_CHANGED_EVENT,
  type Review,
} from "@/lib/reviews";

type ReviewsResponse = {
  reviews: Review[];
};

export function useReviews(options?: { listenForChanges?: boolean }) {
  const listenForChanges = options?.listenForChanges ?? false;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      setError(null);
      const payload = await fetchJson<ReviewsResponse>("/api/reviews");
      setReviews(payload.reviews ?? []);
      return payload.reviews ?? [];
    } catch (loadError) {
      const message = getErrorMessage(loadError, "Failed to load reviews.");
      setError(message);
      throw loadError instanceof Error ? loadError : new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews().catch(() => {
      // Error state is already set in loadReviews.
    });
  }, [loadReviews]);

  useEffect(() => {
    if (!listenForChanges) return;

    function handleReviewsChanged() {
      void loadReviews().catch(() => {
        // Error state is already set in loadReviews.
      });
    }

    window.addEventListener(REVIEWS_CHANGED_EVENT, handleReviewsChanged);
    return () => {
      window.removeEventListener(REVIEWS_CHANGED_EVENT, handleReviewsChanged);
    };
  }, [listenForChanges, loadReviews]);

  return {
    reviews,
    setReviews,
    loading,
    error,
    setError,
    loadReviews,
  };
}
