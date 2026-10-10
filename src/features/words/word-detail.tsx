import { CloseOutlined, EditOutlined, SoundOutlined } from "@ant-design/icons";
import { Button, Result, Spin, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES, wordDetailPath, wordEditPath } from "@/app/nav-items";
import { SPEECH_LANG } from "@/constants/study";
import { CategoryTag } from "@/features/shared/category-tag";
import { PageHeader } from "@/features/shared/page-header";
import { WordSenses } from "@/features/shared/word-senses";
import { useGoBack } from "@/hooks/use-go-back";
import { useWords } from "@/hooks/use-words";
import { speakText } from "@/lib/speech";
import { RelatedWordsList } from "./related-words";
import styles from "./word-detail.module.scss";

type Props = {
  id: string;
  /** "panel" = right side of the desktop split view: Close instead of Back. */
  variant?: "page" | "panel";
  onClose?: () => void;
};

/** Read-only word view: meanings with examples + related words (each opens its own page). */
export function WordDetail({ id, variant = "page", onClose }: Props) {
  const navigate = useNavigate();
  const { search: listSearch } = useLocation();
  const isPanel = variant === "panel";
  const goBack = useGoBack(ROUTES.words);
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
        extra={<Button onClick={() => navigate(ROUTES.words)}>Back to word list</Button>}
      />
    );
  }

  const related = word.relatedWordIds.flatMap((relatedId) => wordsById.get(relatedId) ?? []);

  return (
    <div className={styles.detail}>
      <PageHeader
        backLabel="Back"
        onBack={isPanel ? undefined : goBack}
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
          </>
        }
        extra={
          <>
            <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(wordEditPath(word.id))}>
              Edit
            </Button>
            {isPanel && <Button type="text" icon={<CloseOutlined />} aria-label="Close" onClick={onClose} />}
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
          <RelatedWordsList words={related} onOpen={(relatedId) => navigate(wordDetailPath(relatedId) + listSearch)} />
        ) : (
          <Typography.Text type="secondary">None yet — add them with Edit.</Typography.Text>
        )}
      </section>
    </div>
  );
}
