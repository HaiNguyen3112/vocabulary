import { useState, type CSSProperties } from "react";
import type { ActivityDay } from "@shared/review";
import { HEAT_LEVELS } from "@/constants/study";
import { formatDayLabel, heatLevel, monthLabel, toWeekColumns } from "@/lib/progress";
import styles from "./progress.module.scss";

const LEVEL_CLASS = [styles.heat0, styles.heat1, styles.heat2, styles.heat3, styles.heat4];
const WEEKDAY_ROWS = ["T2", "", "T4", "", "T6", "", "CN"];

function describeDay(day: ActivityDay): string {
  return `${formatDayLabel(day.date)} · ${day.reviews} lượt ôn`;
}

/** One cell per local day, weeks as columns (Mon → Sun); hover or tap a day to read its count. */
export function ActivityHeatmap({ days }: { days: readonly ActivityDay[] }) {
  const [active, setActive] = useState<ActivityDay | null>(null);
  const columns = toWeekColumns(days);
  const max = Math.max(0, ...days.map((day) => day.reviews));
  const total = days.reduce((sum, day) => sum + day.reviews, 0);
  const activeDays = days.filter((day) => day.reviews > 0).length;
  const summary = `${total} lượt ôn trong ${activeDays} ngày, ${Math.round(days.length / 7)} tuần gần nhất`;

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figureTitle}>Số lượt ôn mỗi ngày</figcaption>
      <div className={styles.heatmapScroll}>
        <div
          className={styles.heatmap}
          style={{ "--weeks": columns.length } as CSSProperties}
          role="img"
          aria-label={summary}
          onPointerLeave={() => setActive(null)}
        >
          <span />
          {columns.map((column, index) => (
            <span key={`m${index}`} className={styles.heatMonth}>
              {monthLabel(column)}
            </span>
          ))}
          {WEEKDAY_ROWS.map((label, row) => (
            <div key={`r${row}`} className={styles.heatRow}>
              <span className={styles.heatWeekday}>{label}</span>
              {columns.map((column, index) => {
                const day = column[row];
                if (!day) return <span key={index} />;
                return (
                  <span
                    key={day.date}
                    className={`${styles.heatCell} ${LEVEL_CLASS[heatLevel(day.reviews, max)]}`}
                    data-active={active?.date === day.date || undefined}
                    onPointerEnter={() => setActive(day)}
                    onClick={() => setActive(day)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.heatFooter}>
        <span className={styles.heatReadout} aria-live="polite">
          {active ? describeDay(active) : summary}
        </span>
        <span className={styles.heatLegend} aria-hidden>
          Ít
          {Array.from({ length: HEAT_LEVELS + 1 }, (_, level) => (
            <span key={level} className={`${styles.heatCell} ${LEVEL_CLASS[level]}`} />
          ))}
          Nhiều
        </span>
      </div>
    </figure>
  );
}
