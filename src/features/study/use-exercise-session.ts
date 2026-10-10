import { App } from "antd";
import { useRef, useState } from "react";
import type { Rating } from "@shared/review";
import { SPEECH_LANG } from "@/constants/study";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useReviews } from "@/hooks/use-reviews";
import { buildExercise } from "@/lib/build-exercise";
import type { Exercise, ExerciseKind, StudyWord } from "@/lib/exercise";
import { gradeToRating, ratingToGrade, type Grade } from "@/lib/grade-answer";
import { shouldRecordReview } from "@/lib/review-recording";
import { speakText } from "@/lib/speech";

/** First attempt at each word. */
export type SessionResult = { word: StudyWord; grade: Grade };
export type AnswerResult = { grade: Grade } | { rating: Rating };
export type SessionFeedback = { grade: Grade; rating: Rating };

type SessionOptions = {
  /** Ordered queue. Read once — re-mount (via `key`) to start over. */
  words: readonly StudyWord[];
  /** Distractors for multiple choice. */
  pool: readonly StudyWord[];
  kindFor: (word: StudyWord) => ExerciseKind;
  /** Review mode: a wrong answer sends the word to the end of the queue again. */
  requeueWrong: boolean;
};

type SessionState = {
  queue: StudyWord[];
  position: number;
  current: Exercise | null;
  feedback: SessionFeedback | null;
  results: SessionResult[];
};

const NO_ANSWER = -1;

export function useExerciseSession({ words, pool, kindFor, requeueWrong }: SessionOptions) {
  const { message } = App.useApp();
  const { record } = useReviews();
  const isOnline = useOnlineStatus();

  /** Built lazily when a word becomes current; choice direction alternates by queue position. */
  const buildAt = (queue: readonly StudyWord[], position: number): Exercise | null => {
    const word = queue[position];
    if (!word) return null;
    const direction = position % 2 === 0 ? "word-to-meaning" : "meaning-to-word";
    return buildExercise(word, kindFor(word), pool, { direction });
  };

  const [state, setState] = useState<SessionState>(() => {
    const queue = [...words];
    return { queue, position: 0, current: buildAt(queue, 0), feedback: null, results: [] };
  });
  /** Position answered and not yet moved past — blocks double answers / double "next". */
  const answeredRef = useRef(NO_ANSWER);

  const answer = (result: AnswerResult) => {
    const { current, position, feedback, results } = state;
    if (!current || feedback || answeredRef.current === position) return;
    answeredRef.current = position;

    const grade = "grade" in result ? result.grade : ratingToGrade(result.rating);
    const rating = "rating" in result ? result.rating : gradeToRating(grade);
    const { word } = current;
    const isFirstAttempt = !results.some((item) => item.word === word);
    const isRequeued = requeueWrong && grade === "wrong";

    setState((prev) => ({
      ...prev,
      feedback: { grade, rating },
      results: isFirstAttempt ? [...prev.results, { word, grade }] : prev.results,
      queue: isRequeued ? [...prev.queue, word] : prev.queue,
    }));
    speakText(word.word, SPEECH_LANG);

    if (shouldRecordReview(word.id, isFirstAttempt, isOnline)) {
      void record(word.id, rating).then((review) => {
        if (!review) message.warning("Could not save progress");
      });
    }
  };

  const next = () => {
    const { feedback, position, queue } = state;
    if (!feedback || answeredRef.current !== position) return;
    answeredRef.current = NO_ANSWER;
    const nextPosition = position + 1;
    const exercise = buildAt(queue, nextPosition);
    setState((prev) => ({ ...prev, position: nextPosition, current: exercise, feedback: null }));
  };

  return {
    current: state.current,
    index: state.position,
    total: state.queue.length,
    feedback: state.feedback,
    answer,
    next,
    results: state.results,
    isDone: state.position >= state.queue.length,
  };
}

/** Props shared by the exercise components. */
export type ExerciseProps<K extends Exercise["kind"]> = {
  exercise: Extract<Exercise, { kind: K }>;
  /** True once answered (feedback is showing). */
  disabled: boolean;
  onAnswer: (result: AnswerResult) => void;
};
