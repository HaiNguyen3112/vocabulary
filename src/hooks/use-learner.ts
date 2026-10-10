import { useLearnerStore } from "@/store/learner-store";

export function useLearner() {
  const learner = useLearnerStore((state) => state.learner);
  const signIn = useLearnerStore((state) => state.signIn);
  const signOut = useLearnerStore((state) => state.signOut);
  return { learner, signIn, signOut };
}
