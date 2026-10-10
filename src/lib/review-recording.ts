/**
 * Practice records a bank word's first answer as a review — never a file-deck word
 * (`id: null`), a repeat attempt, or an answer given offline (it could not be saved).
 */
export function shouldRecordReview(wordId: string | null, isFirstAttempt: boolean, isOnline: boolean): wordId is string {
  return wordId !== null && isFirstAttempt && isOnline;
}
