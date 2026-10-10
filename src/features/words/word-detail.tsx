import { EditOutlined, SoundOutlined } from "@ant-design/icons";
import { Button, Result, Spin, Tooltip, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { wordEditPath } from "@/app/nav-items";
import { SPEECH_LANG } from "@/constants/study";
import { CategoryTag } from "@/features/shared/category-tag";
import { PageHeader } from "@/features/shared/page-header";
import { ReviewStatusTag } from "@/features/shared/review-status-tag";
import { WordSenses } from "@/features/shared/word-senses";
import { useWords } from "@/hooks/use-words";
import { speakText } from "@/lib/speech";
import { RelatedWordsList } from "./related-words";
import styles from "./word-detail.module.scss";

type Props = {
  id: string;
  /** Used by "Back to word list" when the word does not exist; the drawer / split view close themselves. */
  onClose: () => void;
  /** Opens a related word in the same panel / drawer. */
  onOpenRelated: (id: string) => void;
};

/** Read-only word view shown beside (split view) or over (drawer) the word list. */
export function WordDetail({ id, onClose, onOpenRelated }: Props) {
  const navigate = useNavigate();
  const { words, isLoading } = useWords();
  const wordsById = new Map(words.map((word) => [word.id, word]));
  const word = wordsById.get(id);

  if (!word) {
    return isLoading ? (
      <Spin size="large" />
    ) : (
      <Result
        status="404"
        title="Word not found"
        extra={<Button onClick={onClose}>Back to word list</Button>}
      />
    );
  }

  const related = word.relatedWordIds.flatMap((relatedId) => wordsById.get(relatedId) ?? []);

  return (
    <div className={styles.detail}>
      <PageHeader
        title={
          <>
            {word.word}
            <Button
              type="text"
              shape="circle"
              icon={<SoundOutlined />}
              aria-label="Pronounce"
              onClick={() => speakText(word.word, SPEECH_LANG)}
            />
            <CategoryTag category={word.category} />
            <ReviewStatusTag wordId={word.id} />
            <Tooltip title="Edit">
              <Button
                type="text"
                shape="circle"
                icon={<EditOutlined />}
                aria-label={`Edit ${word.word}`}
                onClick={() => navigate(wordEditPath(word.id))}
              />
            </Tooltip>
          </>
        }
      />

      <section className={styles.section}>
        <Typography.Text type="secondary" className={styles.label}>
          Meanings & examples
        </Typography.Text>
        <WordSenses senses={word.senses} />
      </section>

      <section className={styles.section}>
        <Typography.Text type="secondary" className={styles.label}>
          Related words{related.length > 0 && ` (${related.length})`}
        </Typography.Text>
        {related.length > 0 ? (
          <RelatedWordsList words={related} onOpen={onOpenRelated} />
        ) : (
          <Typography.Text type="secondary">None yet — add them with Edit.</Typography.Text>
        )}
      </section>
    </div>
  );
}
