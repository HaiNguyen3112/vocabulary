import { ReloadOutlined, SoundOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { formatDefinition } from "@shared/word";
import { SPEECH_LANG } from "@/constants/study";
import { speakText } from "@/lib/speech";
import type { SessionResult } from "./use-exercise-session";
import styles from "./exercise-session.module.scss";

type Props = {
  results: readonly SessionResult[];
  /** Omit to hide the restart button. */
  onRestart?: () => void;
  onExit: () => void;
  restartLabel?: string;
  exitLabel?: string;
};

/** End of a session: accuracy (first attempts), counts per grade and the missed words. */
export function SessionSummary({
  results,
  onRestart,
  onExit,
  restartLabel = "Review again",
  exitLabel = "Back to hub",
}: Props) {
  const count = (grade: SessionResult["grade"]) => results.filter((result) => result.grade === grade).length;
  const correct = count("correct");
  const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
  const missed = results.filter((result) => result.grade === "wrong");

  return (
    <section className={styles.summary} aria-labelledby="session-summary-title">
      <h2 id="session-summary-title" className={styles.summaryTitle}>
        Session complete
      </h2>
      <p className={styles.accuracy}>
        <span className={styles.accuracyValue}>{accuracy}%</span> accuracy
      </p>
      <ul className={styles.counts}>
        <li>
          <strong>{correct}</strong> correct
        </li>
        <li>
          <strong>{count("close")}</strong> close
        </li>
        <li>
          <strong>{missed.length}</strong> wrong
        </li>
      </ul>

      {missed.length > 0 && (
        <>
          <h3 className={styles.missedTitle}>Words to practise</h3>
          <ul className={styles.missed}>
            {missed.map(({ word }, index) => (
              <li key={word.id ?? `${word.word}-${index}`} className={styles.missedItem}>
                <div className={styles.feedbackWordRow}>
                  <span className={styles.missedWord}>{word.word}</span>
                  <Button
                    type="text"
                    icon={<SoundOutlined />}
                    aria-label={`Play ${word.word}`}
                    onClick={() => speakText(word.word, SPEECH_LANG)}
                  />
                </div>
                <p className={`${styles.feedbackDefinition} pre-line`}>{formatDefinition(word.senses)}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className={styles.summaryActions}>
        {onRestart && (
          <Button type="primary" size="large" icon={<ReloadOutlined />} onClick={onRestart}>
            {restartLabel}
          </Button>
        )}
        <Button size="large" onClick={onExit}>
          {exitLabel}
        </Button>
      </div>
    </section>
  );
}
