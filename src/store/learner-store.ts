import { create } from "zustand";
import type { Learner } from "@shared/learner";
import { LEARNER_STORAGE_KEY, parseStoredLearner } from "@/lib/learner-storage";

// Storage can throw (Safari private mode, blocked site data) — the sign-in then lives for the session only.
function readStoredLearner(): Learner | null {
  try {
    return parseStoredLearner(window.localStorage.getItem(LEARNER_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStoredLearner(learner: Learner | null) {
  try {
    if (learner) window.localStorage.setItem(LEARNER_STORAGE_KEY, JSON.stringify(learner));
    else window.localStorage.removeItem(LEARNER_STORAGE_KEY);
  } catch {
    // Ignore — see readStoredLearner.
  }
}

type LearnerState = {
  learner: Learner | null;
  signIn: (learner: Learner) => void;
  signOut: () => void;
};

export const useLearnerStore = create<LearnerState>((set) => ({
  learner: readStoredLearner(),
  signIn: (learner) => {
    writeStoredLearner(learner);
    set({ learner });
  },
  signOut: () => {
    writeStoredLearner(null);
    set({ learner: null });
  },
}));
