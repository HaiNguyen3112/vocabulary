import { STUDY_MODES, type PracticeMode } from "@/constants/study-modes";
import styles from "./mode-grid.module.scss";

type Props = {
  onSelect: (mode: PracticeMode) => void;
};

/** Free-practice modes as index-card buttons. */
export function ModeGrid({ onSelect }: Props) {
  return (
    <ul className={styles.grid}>
      {STUDY_MODES.map(({ mode, label, description, icon }) => (
        <li key={mode}>
          <button type="button" className={styles.mode} onClick={() => onSelect(mode)}>
            <span className={styles.icon} aria-hidden>
              {icon}
            </span>
            <span className={styles.text}>
              <span className={styles.label}>{label}</span>
              <span className={styles.description}>{description}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
