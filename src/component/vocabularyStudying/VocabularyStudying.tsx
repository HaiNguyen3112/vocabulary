import { useEffect, useRef, useState } from "react";
import useFileInput from "../../custom-hook/file-input/UseFileInput";
import {
  dinningoutVocabulary,
  entertainmentVocabulary,
  technologyVocabulary,
  WordType,
} from "../../dummy-data/words";
import WordGrid from "../wordGrid/WordGrid";
import { Button, Select } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";

type SelectType = {
  label: string;
  value: "" | "TECHNOLOGY" | "DINNINGOUT" | "ENTERTAINMENT";
};

const initOption: SelectType[] = [
  { label: "Select a topic ", value: "" },
  { label: "Entertainment", value: "ENTERTAINMENT" },
  { label: "Technology", value: "TECHNOLOGY" },
  { label: "Dinning out", value: "DINNINGOUT" },
];

const VocabularyStudying = () => {
  const { data, handleFileUpload } = useFileInput<WordType>();
  const inputRef = useRef<any>(null);
  const handleOpenFile = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  const [currentSelect, setCurrentSelect] = useState<string>("");
  console.log("currentSelect: ", currentSelect);
  const [currentList, setCurrentList] = useState<WordType[]>([]);

  useEffect(() => {
    if (data?.length) {
      setCurrentList(data);
    }
  }, [data]);

  useEffect(() => {
    switch (currentSelect) {
      case "":
        data?.length && setCurrentList(data);
        break;
      case "ENTERTAINMENT":
        setCurrentList(entertainmentVocabulary);
        break;
      case "TECHNOLOGY":
        setCurrentList(technologyVocabulary);
        break;
      case "DINNINGOUT":
        setCurrentList(dinningoutVocabulary);
        break;

      default:
        setCurrentList(data);
        break;
    }
  }, [currentSelect, data]);

  return (
    <>
      <WordGrid dataInit={currentList}>
        <Button onClick={handleOpenFile} type="primary">
          <FileExcelOutlined /> Upload file
        </Button>
        <Select
          options={initOption}
          value={currentSelect}
          onChange={(value) => setCurrentSelect(value)}
        />
        <input
          style={{ visibility: "hidden", display: "contents" }}
          ref={inputRef}
          type="file"
          onChange={handleFileUpload}
        />
      </WordGrid>
    </>
  );
};

export default VocabularyStudying;
