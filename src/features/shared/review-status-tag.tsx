import { Tag } from "antd";
import { useLearner } from "@/hooks/use-learner";
import { useReviews } from "@/hooks/use-reviews";
import { describeReviewStatus, type ReviewStatus } from "@/lib/review-status";

const LABEL_COLOR: Record<ReviewStatus["label"], string> = {
  New: "default",
  Learning: "orange",
  Review: "green",
};

/** Current learner's review status of a word; renders nothing when signed out, loading or the load failed. */
export function ReviewStatusTag({ wordId }: { wordId: string }) {
  const { learner } = useLearner();
  const { byWordId, status, isLoading } = useReviews();
  // A failed load has no data — showing "New" would misreport a studied word.
  if (!learner || isLoading || status === "error") return null;

  const { label, next } = describeReviewStatus(byWordId[wordId], new Date());
  return <Tag color={LABEL_COLOR[label]}>{next ? `${label} · ${next}` : label}</Tag>;
}
