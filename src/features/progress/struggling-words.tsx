import { ThunderboltOutlined } from "@ant-design/icons";
import { Button, Empty } from "antd";
import { Link, useNavigate } from "react-router-dom";
import type { WordReview } from "@shared/review";
import type { Word } from "@shared/word";
import { ROUTES, wordDetailPath } from "@/app/nav-items";
import { STRUGGLING_LIST_SIZE, STRUGGLING_MIN_LAPSES } from "@/constants/study";
import { toPracticeDeck } from "@/lib/practice-state";
import { findStrugglingWords } from "@/lib/progress";
import styles from "./progress.module.scss";

type Props = {
  words: readonly Word[];
  byWordId: Readonly<Record<string, WordReview>>;
};

const DECK_LABEL = "Từ hay quên";

function describeReview(review: WordReview): string {
  return review.lapses >= STRUGGLING_MIN_LAPSES ? `quên ${review.lapses} lần` : "khó nhớ";
}

/** Words with the most lapses / highest difficulty; practising them is practice-only (nothing recorded). */
export function StrugglingWords({ words, byWordId }: Props) {
  const navigate = useNavigate();
  const items = findStrugglingWords(words, byWordId, STRUGGLING_LIST_SIZE);

  const handlePractice = () => {
    navigate(ROUTES.study, { state: toPracticeDeck(items.map((item) => item.word), DECK_LABEL) });
  };

  return (
    <section className={styles.card} aria-labelledby="struggling-title">
      <div className={styles.sectionHeader}>
        <h2 id="struggling-title" className={styles.sectionTitle}>
          Từ hay quên
        </h2>
        {items.length > 0 && (
          <Button icon={<ThunderboltOutlined />} onClick={handlePractice}>
            Luyện những từ này
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có từ nào hay bị quên" />
      ) : (
        <ol className={styles.wordList}>
          {items.map(({ word, review }) => (
            <li key={word.id}>
              <Link to={wordDetailPath(word.id)} className={styles.wordRow}>
                <span className={styles.wordText}>{word.word}</span>
                <span className={styles.wordMeaning}>{word.senses[0]?.definition ?? ""}</span>
                <span className={styles.wordBadge}>{describeReview(review)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p className={styles.note}>Luyện ở đây không ảnh hưởng lịch ôn — lịch ôn vẫn tự đưa các từ này quay lại sớm.</p>
    </section>
  );
}
