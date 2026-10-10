import { useEffect } from "react";
import type { WordReview } from "@shared/review";
import { useLearnerStore } from "@/store/learner-store";
import { useReviewsStore } from "@/store/reviews-store";

const NO_REVIEWS: Record<string, WordReview> = {};

/** Review state of the signed-in learner; loads on first use and resets when the learner changes. */
export function useReviews() {
  const learnerId = useLearnerStore((state) => state.learner?.id ?? null);
  const loadedFor = useReviewsStore((state) => state.learnerId);
  const byWordId = useReviewsStore((state) => state.byWordId);
  const status = useReviewsStore((state) => state.status);
  const load = useReviewsStore((state) => state.load);
  const record = useReviewsStore((state) => state.record);
  const reset = useReviewsStore((state) => state.reset);

  useEffect(() => {
    if (learnerId) void load(learnerId);
    else reset();
  }, [learnerId, load, reset]);

  if (!learnerId) return { byWordId: NO_REVIEWS, status: "idle" as const, isLoading: false, record };
  // Until the effect runs, the store may still hold another learner's data.
  const isCurrent = loadedFor === learnerId;
  return {
    byWordId: isCurrent ? byWordId : NO_REVIEWS,
    status,
    isLoading: !isCurrent || status === "loading" || status === "idle",
    record,
  };
}
