import { Button } from "antd";
import { useState } from "react";
import { RATINGS, type Rating } from "@shared/review";
import type { ExerciseProps } from "./use-exercise-session";
import { useExerciseKeys } from "./use-exercise-keys";
import styles from "./exercise-session.module.scss";

const RATING_LABEL: Record<Rating, string> = {
  again: "Again",
  hard: "Hard",
  good: "Good",
  easy: "Easy",
};

/** Flip with a click or Space, then rate recall with the buttons or keys 1–4. */
export function FlashcardExercise({ exercise, disabled, onAnswer }: ExerciseProps<"flashcard">) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => setIsFlipped(true);

  const handleRate = (rating: Rating) => {
    if (isFlipped && !disabled) onAnswer({ rating });
  };

  useExerciseKeys({
    onSpace: isFlipped ? undefined : handleFlip,
    onDigit: (digit) => {
      const rating = RATINGS[digit - 1];
      if (rating) handleRate(rating);
    },
  });

  return (
    <div className={styles.exercise}>
      <p className={styles.instruction}>{isFlipped ? "How well did you know it?" : "Recall the meaning, then flip"}</p>
      <button
        type="button"
        className={`${styles.flashcard} ${isFlipped ? styles.flashcardBack : ""}`}
        onClick={handleFlip}
        aria-pressed={isFlipped}
        aria-label={isFlipped ? undefined : `${exercise.front} — show meaning`}
      >
        <span className={styles.flashcardWord}>{exercise.front}</span>
        {isFlipped && <span className={`${styles.flashcardMeaning} pre-line`}>{exercise.back}</span>}
      </button>
      {isFlipped && (
        <div className={styles.ratings} role="group" aria-label="Rate your recall">
          {RATINGS.map((rating, index) => (
            <Button key={rating} size="large" disabled={disabled} onClick={() => handleRate(rating)}>
              <kbd className={styles.optionKey}>{index + 1}</kbd>
              {RATING_LABEL[rating]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
