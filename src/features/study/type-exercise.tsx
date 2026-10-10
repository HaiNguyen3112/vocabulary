import { SoundOutlined } from "@ant-design/icons";
import { App, Button } from "antd";
import { useEffect } from "react";
import { SPEECH_LANG } from "@/constants/study";
import { cancelSpeech, speakText } from "@/lib/speech";
import { AnswerInput } from "./answer-input";
import type { ExerciseProps } from "./use-exercise-session";
import styles from "./exercise-session.module.scss";

const NO_SPEECH_MESSAGE = "Your browser does not support speech synthesis.";

/** Type the word that matches the meaning. */
export function TypeExercise({ exercise, disabled, onAnswer }: ExerciseProps<"type">) {
  return (
    <div className={styles.exercise}>
      <p className={styles.instruction}>Type the word for this meaning</p>
      <div className={`${styles.promptText} pre-line`}>{exercise.prompt}</div>
      <AnswerInput answer={exercise.answer} disabled={disabled} onAnswer={onAnswer} />
    </div>
  );
}

/** Listen & spell: the word plays on mount; the replay button plays it again. */
export function ListenExercise({ exercise, disabled, onAnswer }: ExerciseProps<"listen">) {
  const { message } = App.useApp();
  const { answer } = exercise;

  useEffect(() => {
    speakText(answer, SPEECH_LANG);
    return cancelSpeech;
  }, [answer]);

  const handleReplay = () => {
    if (!speakText(answer, SPEECH_LANG)) message.warning(NO_SPEECH_MESSAGE);
  };

  return (
    <div className={styles.exercise}>
      <p className={styles.instruction}>Listen and spell the word</p>
      <Button size="large" icon={<SoundOutlined />} onClick={handleReplay} className={styles.replay}>
        Play again
      </Button>
      <AnswerInput answer={answer} disabled={disabled} onAnswer={onAnswer} placeholder="Type what you hear" />
    </div>
  );
}
