import { Button, Input } from "antd";
import { useState, type KeyboardEvent } from "react";
import { gradeAnswer } from "@/lib/grade-answer";
import type { AnswerResult } from "./use-exercise-session";
import styles from "./exercise-session.module.scss";

type Props = {
  answer: string;
  disabled: boolean;
  onAnswer: (result: AnswerResult) => void;
  placeholder?: string;
};

/** Text field + "Check"; Enter submits. An empty answer counts as "don't know" (wrong). */
export function AnswerInput({ answer, disabled, onAnswer, placeholder = "Type the word" }: Props) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!disabled) onAnswer({ grade: gradeAnswer(text, answer) });
  };

  const handlePressEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    // Handled here — keeps the session's Enter → next from firing on the same key press.
    event.preventDefault();
    if (!event.repeat) handleSubmit();
  };

  return (
    <div className={styles.answerRow}>
      <Input
        size="large"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onPressEnter={handlePressEnter}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Your answer"
        className={styles.answerInput}
      />
      <Button size="large" type="primary" onClick={handleSubmit} disabled={disabled}>
        Check
      </Button>
    </div>
  );
}
