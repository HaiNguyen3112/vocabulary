import { Alert, Spin } from "antd";
import { fetchActivityRequest } from "@/api/reviews-api";
import { LearnerGate } from "@/features/shared/learner-gate";
import { PageHeader } from "@/features/shared/page-header";
import { useLearner } from "@/hooks/use-learner";
import { useRemote } from "@/hooks/use-remote";
import { useReviews } from "@/hooks/use-reviews";
import { useWords } from "@/hooks/use-words";
import { ActivitySection } from "./activity-section";
import { ProgressOverview } from "./progress-overview";
import { StrugglingWords } from "./struggling-words";
import styles from "./progress.module.scss";

function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** Word-state sections come from the cached reviews (same source as Today); history from the activity API. */
function ProgressContent({ learnerId }: { learnerId: string }) {
  const { words, isLoading: isLoadingWords, error: wordsError } = useWords();
  const { byWordId, status, isLoading: isLoadingReviews } = useReviews();
  const timeZone = browserTimeZone();
  const activity = useRemote(
    `${learnerId}:${timeZone}`,
    async (signal) => (await fetchActivityRequest(learnerId, timeZone, signal)).activity,
    "Không tải được lịch sử ôn tập",
  );

  const isLoading = isLoadingWords || isLoadingReviews;
  const loadError = wordsError ?? (status === "error" ? "Không tải được tiến độ" : null);

  if (!isLoading && loadError) return <Alert type="error" showIcon message={loadError} />;
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <ProgressOverview words={words} byWordId={byWordId} activity={activity.data} />
      <StrugglingWords words={words} byWordId={byWordId} />
      <ActivitySection activity={activity.data} isLoading={activity.isLoading} error={activity.error} />
    </>
  );
}

export function ProgressDashboard() {
  const { learner } = useLearner();
  return (
    <LearnerGate>
      <div className={styles.page}>
        <PageHeader title="Tiến độ" />
        {learner && <ProgressContent learnerId={learner.id} />}
      </div>
    </LearnerGate>
  );
}
