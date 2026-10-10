import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, InputNumber } from "antd";
import { useState } from "react";
import styles from "./word-list-pager.module.scss";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  /** Bigger touch targets (phones). */
  isLarge?: boolean;
  /** Narrow spots (split-view list, phones): range on its own line, Prev / Next share the width. */
  isStacked?: boolean;
  className?: string;
  onChange: (page: number) => void;
};

/** Prev / Next + a "go to page" box: big targets instead of tiny page numbers. */
export function WordListPager({ page, pageSize, total, isLarge = false, isStacked = false, className, onChange }: Props) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const size = isLarge ? "large" : "middle";

  const goTo = (next: number) => {
    const clamped = Math.min(Math.max(1, Math.round(next)), pageCount);
    if (clamped !== page) onChange(clamped);
  };

  return (
    <nav className={`${styles.pager} ${isStacked ? styles.stacked : ""} ${className ?? ""}`} aria-label="Word list pages">
      <span className={styles.range}>
        {first}–{last} of {total.toLocaleString()}
      </span>
      <div className={styles.controls}>
        <Button size={size} icon={<LeftOutlined />} disabled={page <= 1} onClick={() => goTo(page - 1)}>
          Prev
        </Button>
        <span className={styles.jump}>
          {/* Remount on page change so the box shows the current page again. */}
          <PageInput key={page} page={page} pageCount={pageCount} size={size} onCommit={goTo} />
          <span className={styles.of}>/ {pageCount}</span>
        </span>
        <Button size={size} disabled={page >= pageCount} onClick={() => goTo(page + 1)}>
          Next <RightOutlined />
        </Button>
      </div>
    </nav>
  );
}

type PageInputProps = {
  page: number;
  pageCount: number;
  size: "large" | "middle";
  onCommit: (page: number) => void;
};

function PageInput({ page, pageCount, size, onCommit }: PageInputProps) {
  const [draft, setDraft] = useState<number | null>(page);
  const commit = () => (draft ? onCommit(draft) : setDraft(page));

  return (
    <InputNumber
      className={styles.input}
      size={size}
      min={1}
      max={pageCount}
      precision={0}
      controls={false}
      inputMode="numeric"
      aria-label={`Page, 1 to ${pageCount}`}
      value={draft}
      onChange={setDraft}
      onPressEnter={commit}
      onBlur={commit}
      onFocus={(event) => event.target.select()}
    />
  );
}
