import type { WordSense } from "@shared/word";
import { PartOfSpeechTag } from "./part-of-speech-tag";
import styles from "./word-senses.module.scss";

type Props = {
  senses: readonly WordSense[];
  /** Hide example sentences (e.g. in a compact popover). */
  hasExamples?: boolean;
  /** On a ruled card: no gaps between lines, so every line stays on a rule. */
  isRuled?: boolean;
};

/** Meanings grouped by part of speech, each with its example sentences. */
export function WordSenses({ senses, hasExamples = true, isRuled = false }: Props) {
  return (
    <ol className={`${styles.senses} ${isRuled ? styles.ruled : ""}`}>
      {senses.map((sense, index) => (
        <li key={index} className={styles.sense}>
          <div className={styles.definition}>
            {sense.partOfSpeech && <PartOfSpeechTag partOfSpeech={sense.partOfSpeech} />}
            <span className="pre-line">{sense.definition}</span>
          </div>
          {hasExamples && sense.examples.length > 0 && (
            <ul className={styles.examples}>
              {sense.examples.map((example, exampleIndex) => (
                <li key={exampleIndex}>{example}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
