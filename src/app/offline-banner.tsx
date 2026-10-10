import { OFFLINE_BANNER_TEXT } from "@/constants/offline";
import { useOnlineStatus } from "@/hooks/use-online-status";
import styles from "./offline-banner.module.scss";

/** Shown under the top bar while the device is offline. */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className={styles.banner} role="status">
      {OFFLINE_BANNER_TEXT}
    </div>
  );
}
