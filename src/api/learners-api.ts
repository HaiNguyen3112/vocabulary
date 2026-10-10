import { apiFetch } from "@/api/client";
import type { Learner, LearnerInput } from "@shared/learner";

export async function registerLearnerRequest(input: LearnerInput) {
  return apiFetch<{ learner: Learner }>("/api/learners", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function findLearnerRequest(userId: string) {
  return apiFetch<{ learner: Learner }>(`/api/learners/by-user-id/${encodeURIComponent(userId)}`);
}
