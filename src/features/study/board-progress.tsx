import { Progress } from "antd";
import styles from "./board-progress.module.scss";

type Props = {
  matched: number;
  total: number;
  mistakes: number;
};

/** "3 / 8 pairs · 2 misses" with one progress step per pair. */
export function BoardProgress({ matched, total, mistakes }: Props) {
  if (total === 0) return null;

  return (
    <div className={styles.progress}>
      <Progress
        percent={(matched / total) * 100}
        steps={total}
        showInfo={false}
        size="small"
        aria-label="Pairs matched"
      />
      <span aria-live="polite">
        {matched} / {total} pairs
        {mistakes > 0 && <span className={styles.mistakes}> · {mistakes} {mistakes === 1 ? "miss" : "misses"}</span>}
      </span>
    </div>
  );
}
