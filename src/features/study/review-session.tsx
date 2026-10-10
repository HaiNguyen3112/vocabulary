import { Alert, Button, Result, Spin } from "antd";
import { useState } from "react";
import type { WordReview } from "@shared/review";
import { NEW_WORDS_PER_DAY, SESSION_SIZE } from "@/constants/study";
import { useReviews } from "@/hooks/use-reviews";
import { useWords } from "@/hooks/use-words";
import type { StudyWord } from "@/lib/exercise";
import { buildReviewQueue, countNewToday, pickExerciseKind } from "@/lib/review-queue";
import { ExerciseSession } from "./exercise-session";
import { LearnerGate } from "./learner-gate";
import { toStudyWord, useBackToHub } from "./practice-source";
import styles from "./exercise-session.module.scss";

type RunProps = {
  words: readonly StudyWord[];
  byWordId: Readonly<Record<string, WordReview>>;
  onExit: () => void;
  onRestart: () => void;
};

/** One scheduled session; the queue is built once on mount (re-mount via `key` to rebuild it). */
function ReviewRun({ words, byWordId, onExit, onRestart }: RunProps) {
  const [queue] = useState(() => {
    const now = new Date();
    const newAllowance = NEW_WORDS_PER_DAY - countNewToday(Object.values(byWordId), now);
    return buildReviewQueue(words, byWordId, now, newAllowance, SESSION_SIZE);
  });

  if (queue.length === 0) {
    return (
      <Result
        status="success"
        title="All done for today"
        subTitle="No words are due and today's new words are used up."
        extra={<Button onClick={onExit}>Back to hub</Button>}
      />
    );
  }

  return (
    <ExerciseSession
      title="Review"
      words={queue}
      pool={words}
      kindFor={(word) => pickExerciseKind(word.id ? byWordId[word.id] : undefined, word)}
      requeueWrong
      onExit={onExit}
      onRestart={onRestart}
    />
  );
}

function ReviewLoader() {
  const { words, isLoading: isLoadingWords, error } = useWords();
  const { byWordId, status, isLoading: isLoadingReviews } = useReviews();
  const [round, setRound] = useState(0);
  const handleExit = useBackToHub();

  if (isLoadingWords || isLoadingReviews) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }
  if (error) return <Alert type="error" showIcon message={error} />;
  if (status === "error") return <Alert type="error" showIcon message="Could not load your progress" />;

  return (
    <ReviewRun
      key={round}
      words={words.map(toStudyWord)}
      byWordId={byWordId}
      onExit={handleExit}
      onRestart={() => setRound((value) => value + 1)}
    />
  );
}

/** Adaptive SRS session at `/study/review`. */
export function ReviewSession() {
  return (
    <LearnerGate>
      <ReviewLoader />
    </LearnerGate>
  );
}
