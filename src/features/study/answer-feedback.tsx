import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, SoundOutlined } from "@ant-design/icons";
import { Button } from "antd";
import type { ReactNode } from "react";
import { formatDefinition } from "@shared/word";
import { SPEECH_LANG } from "@/constants/study";
import type { Exercise } from "@/lib/exercise";
import type { Grade } from "@/lib/grade-answer";
import { speakText } from "@/lib/speech";
import styles from "./exercise-session.module.scss";

type Props = {
  exercise: Exercise;
  grade: Grade;
  onContinue: () => void;
};

const GRADE_VIEW: Record<Grade, { title: string; icon: ReactNode; className: string }> = {
  correct: { title: "Correct", icon: <CheckCircleFilled />, className: styles.feedbackCorrect },
  close: { title: "Almost — check the spelling", icon: <ExclamationCircleFilled />, className: styles.feedbackClose },
  wrong: { title: "Not quite", icon: <CloseCircleFilled />, className: styles.feedbackWrong },
};

/** The typed answer when it differs from the headword (e.g. "running" in a cloze). */
function answerForm(exercise: Exercise): string | null {
  if (exercise.kind === "flashcard" || exercise.kind === "choice") return null;
  return exercise.answer.toLowerCase() === exercise.word.word.toLowerCase() ? null : exercise.answer;
}

/** Result of an answer: grade, the word (with speak button) and its meaning; "Continue" has focus. */
export function AnswerFeedback({ exercise, grade, onContinue }: Props) {
  const view = GRADE_VIEW[grade];
  const { word } = exercise;
  const form = answerForm(exercise);

  return (
    <section className={`${styles.feedback} ${view.className}`} aria-live="polite">
      <p className={styles.feedbackTitle}>
        {view.icon} {view.title}
      </p>
      <div className={styles.feedbackWordRow}>
        <span className={styles.feedbackWord}>{word.word}</span>
        <Button
          type="text"
          icon={<SoundOutlined />}
          aria-label={`Play ${word.word}`}
          onClick={() => speakText(word.word, SPEECH_LANG)}
        />
      </div>
      {form && (
        <p className={styles.feedbackAnswer}>
          Answer: <strong>{form}</strong>
        </p>
      )}
      <p className={`${styles.feedbackDefinition} pre-line`}>{formatDefinition(word.senses)}</p>
      <div className={styles.feedbackActions}>
        <Button type="primary" size="large" onClick={onContinue} autoFocus>
          Continue
        </Button>
      </div>
    </section>
  );
}
