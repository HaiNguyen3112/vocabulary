import type { ReactNode } from "react";
import { BottomTabBar } from "./bottom-tab-bar";
import { OfflineBanner } from "./offline-banner";
import { TopBar } from "./top-bar";
import styles from "./app-layout.module.scss";

type Props = {
  children: ReactNode;
};

/** Top bar everywhere; bottom tab bar below 992px (hidden by CSS on desktop). */
export function AppLayout({ children }: Props) {
  return (
    <div className={styles.app}>
      <TopBar />
      <OfflineBanner />
      <main className={styles.content}>{children}</main>
      <BottomTabBar />
    </div>
  );
}
