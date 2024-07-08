import { TableProps, Tag } from "antd";
import { getCategoryColor } from "../utils/utils";
import { CATEGORYTYPE } from "../constant/constant";

export interface WordType {
  word: string;
  definition: string;
  category: CATEGORYTYPE;
}

export const columns: TableProps<WordType>["columns"] = [
  {
    title: "Word",
    dataIndex: "word",
    render: (word: string) => {
      return <span>{word}</span>;
    },
  },
  {
    title: "Definition",
    dataIndex: "definition",
    render: (definition: string) => {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: definition.replaceAll("\n", "</br>"),
          }}
        />
      );
    },
  },
  {
    title: "Category",

    dataIndex: "category",
    render: (category: CATEGORYTYPE) => (
      <Tag color={getCategoryColor(category)} key={category}>
        {category?.toUpperCase()}
      </Tag>
    ),
  },
];
