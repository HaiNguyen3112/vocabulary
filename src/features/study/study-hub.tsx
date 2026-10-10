import { CloseOutlined } from "@ant-design/icons";
import { App, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { ROUTES, studyModePath } from "@/app/nav-items";
import type { PracticeMode } from "@/constants/study-modes";
import { CategoryFilterSelect } from "@/features/shared/category-select";
import { ExcelFileButton } from "@/features/shared/excel-file-button";
import type { ParsedWordRows } from "@/lib/excel-rows";
import { LearnerGate } from "@/features/shared/learner-gate";
import { ModeGrid } from "./mode-grid";
import type { PracticeState } from "@/lib/practice-state";
import { usePracticeState } from "./practice-source";
import { TodayCard } from "./today-card";
import styles from "./study-hub.module.scss";

/**
 * Hub at `/`: today's review + free-practice modes. The category filter and the uploaded file deck
 * (studied, never saved) live in the router state, so they survive going to a mode and back.
 */
function HubContent() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const practice = usePracticeState();
  const { category, fileDeck, deckLabel } = practice;

  const updatePractice = (patch: Partial<PracticeState>) => {
    navigate(ROUTES.study, { replace: true, state: { ...practice, ...patch } satisfies PracticeState });
  };

  const handleParsed = ({ valid, invalid }: ParsedWordRows) => {
    if (valid.length === 0) {
      message.error("No valid rows found (columns: word, definition, category)");
      return;
    }
    if (invalid.length > 0) message.warning(`Skipped ${invalid.length} invalid rows`);
    updatePractice({ fileDeck: valid, deckLabel: null });
  };

  const handleSelectMode = (mode: PracticeMode) => navigate(studyModePath(mode), { state: practice });
  const handleStartReview = () => navigate(ROUTES.studyReview, { state: practice });

  return (
    <div className={styles.hub}>
      <TodayCard onStart={handleStartReview} />
      <section className={styles.practice} aria-labelledby="practice-title">
        <div className={styles.practiceHeader}>
          <h2 id="practice-title" className={styles.sectionTitle}>
            Free practice
          </h2>
          <div className={styles.toolbar}>
            <ExcelFileButton onParsed={handleParsed} />
            <CategoryFilterSelect value={category} onChange={(value) => updatePractice({ category: value })} />
            {fileDeck && (
              <Tag closable closeIcon={<CloseOutlined />} onClose={() => updatePractice({ fileDeck: null, deckLabel: null })}>
                {deckLabel ?? "Studying file"} · {fileDeck.length} words
              </Tag>
            )}
          </div>
        </div>
        <ModeGrid onSelect={handleSelectMode} />
      </section>
    </div>
  );
}

export function StudyHub() {
  return (
    <LearnerGate>
      <HubContent />
    </LearnerGate>
  );
}
