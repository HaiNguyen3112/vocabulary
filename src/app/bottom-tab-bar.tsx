import { Link, useLocation } from "react-router-dom";
import { TAB_ITEMS, findNavKey } from "@/app/nav-items";
import styles from "./bottom-tab-bar.module.scss";

/** Mobile navigation; hidden from 992px up. */
export function BottomTabBar() {
  const { pathname } = useLocation();
  const activePath = findNavKey(pathname, TAB_ITEMS);

  return (
    <nav className={styles.bar} aria-label="Main">
      {TAB_ITEMS.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={styles.tab}
          aria-current={item.path === activePath ? "page" : undefined}
        >
          <span className={styles.icon}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
