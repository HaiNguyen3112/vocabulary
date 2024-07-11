// src/components/WordList.tsx
import React, { useEffect, useRef, useState } from "react";
import { columns, WordType } from "../../dummy-data/words";
import { getWords, addWord } from "../firebase-store/store";
import WordImportComponent from "../word-import/WordImportComponent";
import { Input, Select, Table } from "antd";
import styles from "./WordList.module.scss";
import { CategoryTypeList } from "../../constant/constant";

type FilterSearchType = {
  searchKey: string;
  category: string;
};

const WordList: React.FC = () => {
  const [wordList, setWordList] = useState<WordType[]>([]);
  const [filteredWordList, setFilteredWordList] = useState<WordType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterSearchType>({
    category: "",
    searchKey: "",
  });

  const fetchWords = async () => {
    setLoading(true);
    try {
      const words = await getWords();
      setWordList(words);
    } catch (error) {
      console.error("Error fetching words: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  useEffect(() => {
    const filterWords = () => {
      let tempList: WordType[] = [...wordList];

      if (filter.searchKey) {
        tempList = tempList.filter(
          (word: WordType) =>
            word.word
              .toLowerCase()
              .includes(filter.searchKey?.trim().toLowerCase()) ||
            word.definition
              .toLowerCase()
              .includes(filter.searchKey?.trim().toLowerCase())
        );
      }

      if (filter.category) {
        tempList = tempList.filter(
          (word: WordType) => word.category === filter.category
        );
      }

      return tempList;
    };

    setFilteredWordList(filterWords());
  }, [filter, wordList]);

  return (
    <div className={styles.wordlist_container}>
      <div className={styles.header}>Word List</div>
      <div className={styles.header_search}>
        <div className={styles.left_side}>
          <Input.Search
            value={filter.searchKey}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setFilter({ ...filter, searchKey: event.target.value })
            }
          />
          <Select
            value={filter.category}
            onChange={(value: string) =>
              setFilter({ ...filter, category: value })
            }
          >
            {CategoryTypeList.map((category) => {
              return (
                <Select.Option value={category.value} key={category.value}>
                  {category.label}
                </Select.Option>
              );
            })}
          </Select>
        </div>
        <WordImportComponent />
      </div>
      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredWordList}
        pagination={{ defaultPageSize: 10, total: filteredWordList.length }}
      />
    </div>
  );
};

export default WordList;
