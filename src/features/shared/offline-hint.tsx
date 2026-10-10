import { Tooltip } from "antd";
import type { ReactNode } from "react";
import { OFFLINE_HINT } from "@/constants/offline";
import { useOnlineStatus } from "@/hooks/use-online-status";
import styles from "./offline-hint.module.scss";

type Props = {
  /** Receives whether the action is available; pass it to the control's `disabled`. */
  children: (isOnline: boolean) => ReactNode;
  block?: boolean;
};

/** Wraps an action that needs the API: offline it is disabled and explains why on hover. */
export function OfflineHint({ children, block = false }: Props) {
  const isOnline = useOnlineStatus();
  if (isOnline) return <>{children(true)}</>;
  // A disabled button swallows pointer events, so the tooltip listens on a wrapper.
  return (
    <Tooltip title={OFFLINE_HINT}>
      <span className={block ? styles.block : styles.wrapper}>{children(false)}</span>
    </Tooltip>
  );
}
