import { useState } from "react";
import type { ExerciseProps } from "./use-exercise-session";
import { useExerciseKeys } from "./use-exercise-keys";
import styles from "./exercise-session.module.scss";

/** Multiple choice: pick with a click or keys 1–4; after answering the right option lights up. */
export function ChoiceExercise({ exercise, disabled, onAnswer }: ExerciseProps<"choice">) {
  const [picked, setPicked] = useState<string | null>(null);
  const isWordPrompt = exercise.direction === "word-to-meaning";

  const handlePick = (option: string) => {
    if (disabled || picked !== null) return;
    setPicked(option);
    onAnswer({ grade: option === exercise.answer ? "correct" : "wrong" });
  };

  useExerciseKeys({
    onDigit: (digit) => {
      const option = exercise.options[digit - 1];
      if (option !== undefined) handlePick(option);
    },
  });

  const optionClass = (option: string) => {
    if (picked === null) return styles.option;
    if (option === exercise.answer) return `${styles.option} ${styles.optionCorrect}`;
    if (option === picked) return `${styles.option} ${styles.optionWrong}`;
    return styles.option;
  };

  return (
    <div className={styles.exercise}>
      <p className={styles.instruction}>{isWordPrompt ? "Choose the meaning" : "Choose the word"}</p>
      <div className={isWordPrompt ? styles.promptWord : `${styles.promptText} pre-line`}>{exercise.prompt}</div>
      <div className={styles.options} role="group" aria-label="Options">
        {exercise.options.map((option, index) => (
          <button
            key={option}
            type="button"
            className={optionClass(option)}
            disabled={disabled}
            onClick={() => handlePick(option)}
          >
            <kbd className={styles.optionKey}>{index + 1}</kbd>
            <span className={isWordPrompt ? `${styles.optionText} pre-line` : styles.optionWord}>{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
