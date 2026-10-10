import { Drawer } from "antd";
import { useRef, useState, type TouchEvent } from "react";
import { WordDetail } from "./word-detail";
import styles from "./word-detail-drawer.module.scss";

/** Pull the sheet down this far (px) to close it. */
const SWIPE_CLOSE_PX = 80;

type Props = {
  /** Open word; undefined = closed. */
  id?: string;
  /** Bottom sheet on phones, side drawer on tablets. */
  placement: "bottom" | "right";
  onClose: () => void;
  onOpenRelated: (id: string) => void;
};

/** Word detail over the list (below 992px), so closing it returns to the same scroll position. */
export function WordDetailDrawer({ id, placement, onClose, onOpenRelated }: Props) {
  // Keep showing the last word while the drawer animates closed.
  const [shownId, setShownId] = useState(id);
  if (id && id !== shownId) setShownId(id);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (event: TouchEvent) => {
    touchStartY.current = event.touches[0].clientY;
  };
  const handleTouchEnd = (event: TouchEvent) => {
    const start = touchStartY.current;
    touchStartY.current = null;
    if (start !== null && event.changedTouches[0].clientY - start > SWIPE_CLOSE_PX) onClose();
  };

  return (
    <Drawer
      open={Boolean(id)}
      placement={placement}
      height="90%"
      width={480}
      closable={false}
      onClose={onClose}
      rootClassName={placement === "bottom" ? styles.sheet : undefined}
      styles={{ body: { padding: 0 } }}
    >
      {placement === "bottom" && (
        <div
          className={styles.handle}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-hidden="true"
        />
      )}
      <div className={styles.body}>
        {shownId && <WordDetail key={shownId} id={shownId} onClose={onClose} onOpenRelated={onOpenRelated} />}
      </div>
    </Drawer>
  );
}
