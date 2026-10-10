import type { TableProps } from "antd";
import type { WordInput } from "@shared/word";
import { CategoryTag } from "./category-tag";
import { WordSenses } from "./word-senses";

/** Columns for read-only word lists (import preview). */
export function getWordColumns<T extends WordInput>(): NonNullable<TableProps<T>["columns"]> {
  return [
    { title: "Word", dataIndex: "word", key: "word" },
    {
      title: "Meaning",
      dataIndex: "senses",
      key: "senses",
      render: (senses: T["senses"]) => <WordSenses senses={senses} />,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: T["category"]) => <CategoryTag category={category} />,
    },
  ];
}
