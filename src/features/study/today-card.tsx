import { CheckCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Spin } from "antd";
import { useReviews } from "@/hooks/use-reviews";
import { useWords } from "@/hooks/use-words";
import { todayStats } from "@/lib/review-queue";
import { toStudyWord } from "./practice-source";
import { OfflineHint } from "@/features/shared/offline-hint";
import styles from "./study-hub.module.scss";

type Props = {
  onStart: () => void;
};

/** Today's scheduled work for the learner + the Start review button. */
export function TodayCard({ onStart }: Props) {
  const { words, isLoading: isLoadingWords, error } = useWords();
  const { byWordId, status, isLoading: isLoadingReviews } = useReviews();
  const isLoading = isLoadingWords || isLoadingReviews;
  const loadError = error ?? (status === "error" ? "Could not load your progress" : null);

  const { due, newLeft, learned } = todayStats(words.map(toStudyWord), byWordId, new Date());
  const isAllDone = due === 0 && newLeft === 0;
  const stats = [
    { label: "Due", value: due },
    { label: "New left", value: newLeft },
    { label: "Learned", value: learned },
  ];

  return (
    <section className={styles.today} aria-labelledby="today-title">
      <h2 id="today-title" className={styles.sectionTitle}>
        Today
      </h2>
      {!isLoading && loadError ? (
        <Alert type="error" showIcon message={loadError} />
      ) : (
        <Spin spinning={isLoading} delay={300}>
          <dl className={styles.stats}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <dt className={styles.statLabel}>{stat.label}</dt>
                <dd className={styles.statValue}>{isLoading ? "–" : stat.value}</dd>
              </div>
            ))}
          </dl>
          <OfflineHint block>
            {(isOnline) => (
              <Button
                type="primary"
                size="large"
                block
                icon={isAllDone ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
                disabled={isLoading || isAllDone || !isOnline}
                onClick={onStart}
                className={styles.start}
              >
                {isAllDone && !isLoading ? "All done for today" : "Start review"}
              </Button>
            )}
          </OfflineHint>
        </Spin>
      )}
    </section>
  );
}
