import { Link, useLocation } from "react-router-dom";
import { NAV_ITEMS, ROUTES, findNavKey } from "@/app/nav-items";
import { ThemeToggle } from "./theme-toggle";
import styles from "./top-bar.module.scss";

export function TopBar() {
  const { pathname } = useLocation();
  const activePath = findNavKey(pathname);

  return (
    <header className={styles.bar}>
      <Link to={ROUTES.study} className={styles.brand}>
        Study Vocabulary
      </Link>
      <nav className={styles.nav} aria-label="Main">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={styles.link}
            aria-current={item.path === activePath ? "page" : undefined}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <ThemeToggle />
    </header>
  );
}
