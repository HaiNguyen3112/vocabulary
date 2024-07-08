import { useEffect, useRef, useState } from "react";
import useFileInput from "../../custom-hook/file-input/UseFileInput";
import { WordType } from "../../dummy-data/words";
import WordGrid from "../wordGrid/WordGrid";
import { Button, Select, Spin } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";
import { getWords } from "../firebase-store/store";
import { CategoryTypeList } from "../../constant/constant";

const VocabularyStudying = () => {
  const [wordList, setWordList] = useState<WordType[]>([]);
  const { data, handleFileUpload } = useFileInput<WordType>();
  const inputRef = useRef<any>(null);
  const handleOpenFile = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  const [currentSelect, setCurrentSelect] = useState<string>("");
  const [currentList, setCurrentList] = useState<WordType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (data?.length) {
      setWordList(data);
    }
  }, [data]);

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
    if (!currentSelect) {
      setCurrentList(wordList);
    } else {
      const tempList = wordList.filter(
        (word: WordType) => word.category === currentSelect
      );
      setCurrentList(tempList);
    }
  }, [currentSelect, wordList]);

  return (
    <Spin spinning={loading} delay={500} size="large">
      <WordGrid dataInit={currentList}>
        <Button onClick={handleOpenFile} type="primary">
          <FileExcelOutlined /> Upload file
        </Button>
        <Select
          value={currentSelect}
          onChange={(value: string) => setCurrentSelect(value)}
          style={{ minWidth: 150, textAlign: "left" }}
        >
          {CategoryTypeList.map((category) => {
            return (
              <Select.Option value={category.value} key={category.value}>
                {category.label}
              </Select.Option>
            );
          })}
        </Select>
        <input
          style={{ visibility: "hidden", display: "contents" }}
          ref={inputRef}
          type="file"
          onChange={handleFileUpload}
        />
      </WordGrid>
    </Spin>
  );
};

export default VocabularyStudying;
