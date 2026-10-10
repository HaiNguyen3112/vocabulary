import { CloseOutlined } from "@ant-design/icons";
import { Button, Form, Select } from "antd";
import { formatDefinition, type Word } from "@shared/word";
import { WordSenses } from "@/features/shared/word-senses";
import { suggestRelatedWords } from "@/lib/related-words";
import type { WordFormValues } from "./word-form-values";
import styles from "./related-words-field.module.scss";

type InputProps = {
  candidates: readonly Word[];
  typedWord: string;
  value?: string[];
  onChange?: (ids: string[]) => void;
};

const toOption = (word: Word) => ({ value: word.id, label: word.word });

/** Controlled input: a search picker plus the linked words shown with word types + meanings. */
function RelatedWordsInput({ candidates, typedWord, value = [], onChange }: InputProps) {
  const byId = new Map(candidates.map((word) => [word.id, word]));
  const suggestedWords = suggestRelatedWords(typedWord, candidates, new Set(value)).flatMap(
    (id) => byId.get(id) ?? [],
  );
  const suggested = new Set(suggestedWords.map((word) => word.id));
  const selectedWords = value.flatMap((id) => byId.get(id) ?? []);

  const options = [
    ...(suggestedWords.length > 0
      ? [{ label: "Suggested (same stem)", options: suggestedWords.map(toOption) }]
      : []),
    { label: "All words", options: candidates.filter((word) => !suggested.has(word.id)).map(toOption) },
  ];

  return (
    <div className={styles.input}>
      <Select
        mode="multiple"
        showSearch
        optionFilterProp="label"
        placeholder="Search words to link"
        options={options}
        value={value}
        onChange={onChange}
        maxTagCount={0}
        maxTagPlaceholder={(omitted) => `${omitted.length} linked`}
        optionRender={(option) => (
          <div className={styles.option}>
            <span className={styles.optionWord}>{option.label}</span>
            <span className={styles.optionMeaning}>
              {formatDefinition(byId.get(String(option.value))?.senses ?? [])}
            </span>
          </div>
        )}
      />
      {selectedWords.length > 0 && (
        <ul className={styles.selected}>
          {selectedWords.map((word) => (
            <li key={word.id} className={styles.card}>
              <div className={styles.cardBody}>
                <span className={styles.cardWord}>{word.word}</span>
                <WordSenses senses={word.senses} hasExamples={false} />
              </div>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                aria-label={`Unlink ${word.word}`}
                onClick={() => onChange?.(value.filter((id) => id !== word.id))}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Props = {
  words: readonly Word[];
  /** Word being edited (excluded from the options). */
  selfId: string | null;
};

/** Word family picker; words sharing the typed word's stem are suggested first. */
export function RelatedWordsField({ words, selfId }: Props) {
  const form = Form.useFormInstance<WordFormValues>();
  const typedWord = Form.useWatch("word", form) ?? "";

  return (
    <Form.Item<WordFormValues>
      label="Related words"
      name="relatedWordIds"
      extra="Other forms of this word (noun, verb, adjective…). Linking is two-way."
    >
      <RelatedWordsInput candidates={words.filter((word) => word.id !== selfId)} typedWord={typedWord} />
    </Form.Item>
  );
}
