import { Alert, Spin } from "antd";
import type { Activity } from "@shared/review";
import { ActivityHeatmap } from "./activity-heatmap";
import { MasteredChart } from "./mastered-chart";
import styles from "./progress.module.scss";

type Props = {
  activity: Activity | null;
  isLoading: boolean;
  error: string | null;
};

function formatSince(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });
}

/** Review history: daily heatmap + mastered words over time. History starts at the first logged answer. */
export function ActivitySection({ activity, isLoading, error }: Props) {
  return (
    <section className={styles.card} aria-labelledby="activity-title">
      <h2 id="activity-title" className={styles.sectionTitle}>
        Hoạt động
      </h2>
      {error && !activity ? (
        <Alert type="warning" showIcon message={error} />
      ) : !activity ? (
        <Spin spinning={isLoading} delay={300}>
          <div className={styles.chartPlaceholder} />
        </Spin>
      ) : (
        <>
          <p className={styles.note}>
            {activity.since
              ? `Lịch sử ôn tập được ghi lại từ ngày ${formatSince(activity.since)}.`
              : "Lịch sử ôn tập bắt đầu được ghi lại từ lượt ôn tiếp theo của bạn."}
          </p>
          <ActivityHeatmap days={activity.days} />
          <MasteredChart days={activity.days} />
        </>
      )}
    </section>
  );
}
