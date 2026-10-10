import { EditOutlined } from "@ant-design/icons";
import { Button, type TableProps } from "antd";
import type { Word } from "@shared/word";
import { CategoryTag } from "@/features/shared/category-tag";
import { WordSenses } from "@/features/shared/word-senses";
import { RelatedWordsPeek } from "./related-words";
import styles from "./word-table-columns.module.scss";

type Options = {
  wordsById: ReadonlyMap<string, Word>;
  onOpen: (id: string) => void;
  onEdit: (word: Word) => void;
};

export function getWordTableColumns({ wordsById, onOpen, onEdit }: Options): NonNullable<TableProps<Word>["columns"]> {
  return [
    {
      title: "Word",
      dataIndex: "word",
      key: "word",
      render: (text: string, word) => (
        <Button type="link" className={styles.wordLink} onClick={() => onOpen(word.id)}>
          {text}
        </Button>
      ),
    },
    {
      title: "Meaning",
      dataIndex: "senses",
      key: "senses",
      render: (senses: Word["senses"]) => <WordSenses senses={senses} hasExamples={false} />,
    },
    {
      title: "Related",
      dataIndex: "relatedWordIds",
      key: "related",
      render: (ids: string[]) => (
        <RelatedWordsPeek words={ids.flatMap((id) => wordsById.get(id) ?? [])} onOpen={onOpen} />
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: Word["category"]) => <CategoryTag category={category} />,
    },
    {
      title: "",
      key: "actions",
      width: 56,
      render: (_, word) => (
        <Button type="text" icon={<EditOutlined />} aria-label={`Edit ${word.word}`} onClick={() => onEdit(word)} />
      ),
    },
  ];
}
