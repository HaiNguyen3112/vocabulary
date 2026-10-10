import type { Activity, WordReview } from "@shared/review";
import { countBuckets, PROGRESS_BUCKETS, retentionPercent, type ProgressBucket } from "@/lib/progress";
import styles from "./progress.module.scss";

type Props = {
  words: readonly { id: string }[];
  byWordId: Readonly<Record<string, WordReview>>;
  /** Null while loading or when history failed to load. */
  activity: Activity | null;
};

const BUCKET_VIEW: Record<ProgressBucket, { label: string; hint: string; className: string }> = {
  unstudied: { label: "Chưa học", hint: "chưa ôn lần nào", className: styles.bucketUnstudied },
  learning: { label: "Đang học", hint: "mới gặp hoặc vừa quên", className: styles.bucketLearning },
  known: { label: "Đã thuộc", hint: "nhớ dưới 3 tuần", className: styles.bucketKnown },
  mastered: { label: "Nhớ chắc", hint: "nhớ từ 3 tuần trở lên", className: styles.bucketMastered },
};

const DASH = "–";

/** Where every bank word stands (ordinal one-hue bar + counts), retention and streak. */
export function ProgressOverview({ words, byWordId, activity }: Props) {
  const counts = countBuckets(words, byWordId);
  const total = words.length;
  const retention = activity ? retentionPercent(activity.retention) : null;
  const streak = activity?.streak;

  return (
    <section className={styles.card} aria-labelledby="overview-title">
      <h2 id="overview-title" className={styles.sectionTitle}>
        Tổng quan · {total} từ
      </h2>
      {total > 0 && (
        <div className={styles.bucketBar} aria-hidden>
          {PROGRESS_BUCKETS.filter((bucket) => counts[bucket] > 0).map((bucket) => (
            <span
              key={bucket}
              className={BUCKET_VIEW[bucket].className}
              style={{ flexGrow: counts[bucket] }}
            />
          ))}
        </div>
      )}
      <dl className={styles.buckets}>
        {PROGRESS_BUCKETS.map((bucket) => (
          <div key={bucket} className={styles.bucket}>
            <dt className={styles.bucketLabel}>
              <span className={`${styles.swatch} ${BUCKET_VIEW[bucket].className}`} aria-hidden />
              {BUCKET_VIEW[bucket].label}
            </dt>
            <dd className={styles.bucketValue}>{counts[bucket]}</dd>
            <dd className={styles.bucketHint}>{BUCKET_VIEW[bucket].hint}</dd>
          </div>
        ))}
      </dl>
      <dl className={styles.highlights}>
        <div className={styles.highlight}>
          <dt className={styles.statLabel}>Tỷ lệ nhớ · 30 ngày</dt>
          <dd className={styles.statValue}>{retention === null ? DASH : `${retention}%`}</dd>
          <dd className={styles.statHint}>
            {activity && activity.retention.total > 0
              ? `${activity.retention.passed}/${activity.retention.total} lượt ôn từ đã thuộc`
              : "chưa có lượt ôn từ đã thuộc"}
          </dd>
        </div>
        <div className={styles.highlight}>
          <dt className={styles.statLabel}>Chuỗi ngày học</dt>
          <dd className={styles.statValue}>{streak ? streak.current : DASH}</dd>
          <dd className={styles.statHint}>{streak ? `dài nhất ${streak.longest} ngày` : " "}</dd>
        </div>
      </dl>
    </section>
  );
}
