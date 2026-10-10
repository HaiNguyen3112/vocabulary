import { CloseOutlined } from "@ant-design/icons";
import { App, Button, Empty, Progress } from "antd";
import { useRef, type ReactNode } from "react";
import type { Exercise, ExerciseKind, StudyWord } from "@/lib/exercise";
import { AnswerFeedback } from "./answer-feedback";
import { ChoiceExercise } from "./choice-exercise";
import { ClozeExercise } from "./cloze-exercise";
import { FlashcardExercise } from "./flashcard-exercise";
import { SessionSummary } from "./session-summary";
import { ListenExercise, TypeExercise } from "./type-exercise";
import { useExerciseKeys } from "./use-exercise-keys";
import { useExerciseSession, type AnswerResult } from "./use-exercise-session";
import styles from "./exercise-session.module.scss";

type Props = {
  title: string;
  words: readonly StudyWord[];
  pool: readonly StudyWord[];
  kindFor: (word: StudyWord) => ExerciseKind;
  requeueWrong: boolean;
  onExit: () => void;
  /** Start over — the caller re-mounts the session (new `key`). Omit to hide the restart button. */
  onRestart?: () => void;
  restartLabel?: string;
  exitLabel?: string;
};

const CHECK_HINT = (
  <>
    <kbd>Enter</kbd> check
  </>
);

const KEY_HINT: Record<ExerciseKind, ReactNode> = {
  choice: (
    <>
      <kbd>1</kbd>–<kbd>4</kbd> pick
    </>
  ),
  flashcard: (
    <>
      <kbd>Space</kbd> flip · <kbd>1</kbd>–<kbd>4</kbd> rate
    </>
  ),
  type: CHECK_HINT,
  listen: CHECK_HINT,
  cloze: CHECK_HINT,
};

function renderExercise(exercise: Exercise, disabled: boolean, onAnswer: (result: AnswerResult) => void) {
  switch (exercise.kind) {
    case "choice":
      return <ChoiceExercise exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case "type":
      return <TypeExercise exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case "listen":
      return <ListenExercise exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case "cloze":
      return <ClozeExercise exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
    case "flashcard":
      return <FlashcardExercise exercise={exercise} disabled={disabled} onAnswer={onAnswer} />;
  }
}

/** One study session: progress header, the current exercise, feedback, then a summary. */
export function ExerciseSession({
  title,
  words,
  pool,
  kindFor,
  requeueWrong,
  onExit,
  onRestart,
  restartLabel = "Review again",
  exitLabel = "Back to hub",
}: Props) {
  const { modal } = App.useApp();
  const session = useExerciseSession({ words, pool, kindFor, requeueWrong });
  const { current, index, total, feedback, isDone } = session;
  const isConfirmOpenRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // After "Stay", focus the answer field if there is one; otherwise drop focus so Space / digits
  // reach the session shortcuts instead of re-pressing the ✕ button.
  const restoreFocus = () => {
    const input = stageRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)");
    if (input) input.focus();
    else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const handleExit = () => {
    if (isConfirmOpenRef.current) return;
    isConfirmOpenRef.current = true;
    modal.confirm({
      title: "Leave this session?",
      okText: "Leave",
      cancelText: "Stay",
      onOk: onExit,
      focusTriggerAfterClose: false,
      afterClose: () => {
        isConfirmOpenRef.current = false;
        restoreFocus();
      },
    });
  };

  useExerciseKeys({
    onEnter: feedback ? session.next : undefined,
    onEscape: isDone ? undefined : handleExit,
  });

  if (total === 0) {
    return (
      <div className={styles.session}>
        <Empty className={styles.empty} description="No words to study" />
        <Button onClick={onExit}>{exitLabel}</Button>
      </div>
    );
  }

  if (isDone || !current) {
    return (
      <div className={styles.session}>
        <SessionSummary
          results={session.results}
          onRestart={onRestart}
          onExit={onExit}
          restartLabel={restartLabel}
          exitLabel={exitLabel}
        />
      </div>
    );
  }

  const answered = index + (feedback ? 1 : 0);

  return (
    <div className={styles.session}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.progress}>
          <Progress percent={(answered / total) * 100} showInfo={false} size="small" aria-label="Session progress" />
          <span className={styles.progressCount}>
            {index + 1} / {total}
          </span>
        </div>
        <Button type="text" icon={<CloseOutlined />} onClick={handleExit} aria-label="Leave session" />
      </header>

      <div key={index} ref={stageRef} className={styles.stage}>
        {renderExercise(current, feedback !== null, session.answer)}
      </div>

      {feedback && <AnswerFeedback exercise={current} grade={feedback.grade} onContinue={session.next} />}

      <p className={styles.keyHint}>
        {feedback ? (
          <>
            <kbd>Enter</kbd> continue
          </>
        ) : (
          KEY_HINT[current.kind]
        )}{" "}
        · <kbd>Esc</kbd> leave
      </p>
    </div>
  );
}
