import { AnswerInput } from "./answer-input";
import type { ExerciseProps } from "./use-exercise-session";
import styles from "./exercise-session.module.scss";

/** Fill in the blank: an example sentence with the word replaced by `___`, the meaning as a hint. */
export function ClozeExercise({ exercise, disabled, onAnswer }: ExerciseProps<"cloze">) {
  return (
    <div className={styles.exercise}>
      <p className={styles.instruction}>Fill in the blank</p>
      <div className={`${styles.sentence} pre-line`}>{exercise.sentence}</div>
      <p className={styles.hint}>
        <span className={styles.hintLabel}>Hint: </span>
        <span className="pre-line">{exercise.hint}</span>
      </p>
      <AnswerInput answer={exercise.answer} disabled={disabled} onAnswer={onAnswer} placeholder="Missing word" />
    </div>
  );
}
