import { Alert, Button, Empty, Spin } from "antd";
import { useState } from "react";
import type { WordInput } from "@shared/word";
import type { CategoryFilter } from "@/constants/categories";
import { PRACTICE_SESSION_SIZE } from "@/constants/study";
import { PRACTICE_KIND, STUDY_MODES, type PracticeMode } from "@/constants/study-modes";
import { useWords } from "@/hooks/use-words";
import { findCloze } from "@/lib/build-exercise";
import { filterWords } from "@/lib/filter-words";
import { pickPairs } from "@/lib/match-board";
import { ExerciseSession } from "./exercise-session";
import { LearnerGate } from "@/features/shared/learner-gate";
import { MatchPractice } from "./match-practice";
import { toStudyWord, useBackToHub, usePracticeState } from "./practice-source";
import styles from "./exercise-session.module.scss";

type ExerciseMode = Exclude<PracticeMode, "match">;

const EXIT_LABEL = "Back to study";

type RunProps = {
  mode: ExerciseMode;
  source: readonly WordInput[];
  category: CategoryFilter;
  onExit: () => void;
  onRestart: () => void;
};

/** One practice session; its words are picked once on mount (re-mount via `key` for a new set). */
function PracticeRun({ mode, source, category, onExit, onRestart }: RunProps) {
  const kind = PRACTICE_KIND[mode];
  const [words] = useState(() => {
    const filtered = filterWords(source, { search: "", category }).map(toStudyWord);
    const candidates = kind === "cloze" ? filtered.filter((word) => findCloze(word) !== null) : filtered;
    return pickPairs(candidates, PRACTICE_SESSION_SIZE);
  });

  if (kind === "cloze" && words.length === 0) {
    return (
      <div className={styles.session}>
        <Empty className={styles.empty} description="No words with example sentences" />
        <Button onClick={onExit}>{EXIT_LABEL}</Button>
      </div>
    );
  }

  return (
    <ExerciseSession
      title={STUDY_MODES.find((info) => info.mode === mode)?.label ?? mode}
      words={words}
      pool={source.map(toStudyWord)}
      kindFor={() => kind}
      requeueWrong={false}
      onExit={onExit}
      onRestart={onRestart}
      restartLabel="Practice again"
      exitLabel={EXIT_LABEL}
    />
  );
}

function PracticeLoader({ mode }: { mode: PracticeMode }) {
  const { category, fileDeck } = usePracticeState();
  const { words, isLoading, error } = useWords();
  const [round, setRound] = useState(0);
  const handleExit = useBackToHub();

  if (!fileDeck && isLoading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }
  if (!fileDeck && error) return <Alert type="error" showIcon message={error} />;

  const source = fileDeck ?? words;
  if (mode === "match") {
    return <MatchPractice source={source} initialCategory={category} isFileDeck={fileDeck !== null} />;
  }
  return (
    <PracticeRun
      key={round}
      mode={mode}
      source={source}
      category={category}
      onExit={handleExit}
      onRestart={() => setRound((value) => value + 1)}
    />
  );
}

/**
 * Free practice at `/study/:mode` — one exercise kind, or the match board (which records nothing).
 * Exercises record a bank word's first answer as a review; file-deck words (`id: null`) never do.
 */
export function PracticeSession({ mode }: { mode: PracticeMode }) {
  return (
    <LearnerGate>
      <PracticeLoader mode={mode} />
    </LearnerGate>
  );
}
