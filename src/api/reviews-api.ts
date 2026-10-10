import { apiFetch } from "@/api/client";
import type { Activity, ReviewInput, WordReview } from "@shared/review";

export async function fetchReviewsRequest(learnerId: string) {
  return apiFetch<{ reviews: WordReview[] }>(`/api/learners/${encodeURIComponent(learnerId)}/reviews`);
}

export async function postReviewRequest(learnerId: string, input: ReviewInput) {
  return apiFetch<{ review: WordReview }>(`/api/learners/${encodeURIComponent(learnerId)}/reviews`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchActivityRequest(learnerId: string, timeZone: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ tz: timeZone });
  return apiFetch<{ activity: Activity }>(`/api/learners/${encodeURIComponent(learnerId)}/activity?${query}`, {
    signal,
  });
}
