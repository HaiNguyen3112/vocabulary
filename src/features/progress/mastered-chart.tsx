import { useState, type PointerEvent } from "react";
import type { ActivityDay } from "@shared/review";
import { formatDayLabel, niceMax } from "@/lib/progress";
import styles from "./progress.module.scss";

// The plot stretches to its box (preserveAspectRatio="none"); strokes stay 2px via non-scaling-stroke.
const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 140;

type Point = { day: ActivityDay; value: number; x: number; y: number };

/** Mastered words per day — a single series, so the title names it and no legend is drawn. */
export function MasteredChart({ days }: { days: readonly ActivityDay[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const top = niceMax(Math.max(0, ...days.map((day) => day.mastered ?? 0)));
  // Only recorded days (history start → today) are plotted, spread across the full width.
  const recorded = days.flatMap((day) => (day.mastered === null ? [] : [{ day, value: day.mastered }]));
  const lastIndex = Math.max(1, recorded.length - 1);
  const points: Point[] = recorded.map(({ day, value }, index) => ({
    day,
    value,
    x: (index / lastIndex) * VIEW_WIDTH,
    y: VIEW_HEIGHT - (value / top) * VIEW_HEIGHT,
  }));
  const latest = points.at(-1);

  if (points.length < 2) {
    return (
      <figure className={styles.figure}>
        <figcaption className={styles.figureTitle}>Số từ nhớ chắc</figcaption>
        <p className={styles.note}>
          Cần thêm vài ngày dữ liệu để vẽ biểu đồ{latest ? ` · hiện có ${latest.value} từ nhớ chắc` : ""}.
        </p>
      </figure>
    );
  }

  const handlePointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH;
    let nearest = 0;
    points.forEach((point, index) => {
      if (Math.abs(point.x - x) < Math.abs((points[nearest]?.x ?? 0) - x)) nearest = index;
    });
    setHoverIndex(nearest);
  };

  const hovered = hoverIndex === null ? null : points[hoverIndex];
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const toPercent = (point: Point) => ({ left: `${(point.x / VIEW_WIDTH) * 100}%`, top: `${(point.y / VIEW_HEIGHT) * 100}%` });

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figureTitle}>
        Số từ nhớ chắc{latest ? ` · ${latest.value}` : ""}
      </figcaption>
      <div className={styles.chart}>
        <span className={styles.axisTop}>{top}</span>
        <span className={styles.axisBottom}>0</span>
        <div
          className={styles.plot}
          role="img"
          aria-label={`Số từ nhớ chắc: ${points[0]?.value} ngày đầu, ${latest?.value} hôm nay`}
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} preserveAspectRatio="none" className={styles.svg} aria-hidden>
            <line x1={0} x2={VIEW_WIDTH} y1={VIEW_HEIGHT / 2} y2={VIEW_HEIGHT / 2} className={styles.grid} />
            <line x1={0} x2={VIEW_WIDTH} y1={VIEW_HEIGHT} y2={VIEW_HEIGHT} className={styles.baseline} />
            <path d={path} className={styles.line} />
          </svg>
          {hovered && (
            <>
              <span className={styles.crosshair} style={{ left: toPercent(hovered).left }} />
              <span className={styles.marker} style={toPercent(hovered)} />
              {/* Clamped so the label never spills past the card edge. */}
              <span className={styles.tooltip} style={{ left: `${Math.min(85, Math.max(15, (hovered.x / VIEW_WIDTH) * 100))}%` }}>
                <strong>{hovered.value}</strong> từ · {formatDayLabel(hovered.day.date)}
              </span>
            </>
          )}
        </div>
        <span className={styles.axisStart}>{formatDayLabel(points[0]?.day.date ?? "")}</span>
        <span className={styles.axisEnd}>Hôm nay</span>
      </div>
    </figure>
  );
}
