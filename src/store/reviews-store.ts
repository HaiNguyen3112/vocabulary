import { create } from "zustand";
import type { Rating, WordReview } from "@shared/review";
import { ApiError } from "@/api/client";
import { fetchReviewsRequest, postReviewRequest } from "@/api/reviews-api";
import { useLearnerStore } from "@/store/learner-store";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type ReviewsState = {
  learnerId: string | null;
  byWordId: Record<string, WordReview>;
  status: LoadStatus;
  /** Loads once per learner; a different learner replaces the cache. */
  load: (learnerId: string) => Promise<void>;
  /** Returns the new review, or null when saving failed (the caller reports it). */
  record: (wordId: string, rating: Rating) => Promise<WordReview | null>;
  reset: () => void;
};

const EMPTY = { learnerId: null, byWordId: {}, status: "idle" } as const;

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  ...EMPTY,

  load: async (learnerId) => {
    const state = get();
    if (state.learnerId === learnerId && (state.status === "loading" || state.status === "ready")) return;
    set({ learnerId, byWordId: {}, status: "loading" });
    try {
      const { reviews } = await fetchReviewsRequest(learnerId);
      if (get().learnerId !== learnerId) return;
      set({ byWordId: Object.fromEntries(reviews.map((review) => [review.wordId, review])), status: "ready" });
    } catch (error) {
      if (get().learnerId !== learnerId) return;
      if (error instanceof ApiError && error.status === 404) {
        useLearnerStore.getState().signOut();
        get().reset();
        return;
      }
      set({ status: "error" });
    }
  },

  record: async (wordId, rating) => {
    const learnerId = get().learnerId;
    if (!learnerId) return null;
    try {
      const { review } = await postReviewRequest(learnerId, { wordId, rating });
      if (get().learnerId === learnerId) {
        set((state) => ({ byWordId: { ...state.byWordId, [review.wordId]: review } }));
      }
      return review;
    } catch {
      return null;
    }
  },

  reset: () => set({ ...EMPTY }),
}));
