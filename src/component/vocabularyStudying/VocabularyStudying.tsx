import { useRef } from "react";
import useFileInput from "../../custom-hook/file-input/UseFileInput";
import { WordType } from "../../dummy-data/words";
import WordGrid from "../wordGrid/WordGrid";
import { Button } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";

const VocabularyStudying = () => {
  const { data, handleFileUpload } = useFileInput<WordType>();
  const inputRef = useRef<any>(null);
  const handleOpenFile = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <>
      <WordGrid dataInit={data}>
        <Button onClick={handleOpenFile} type="primary">
          <FileExcelOutlined /> Upload file
        </Button>
        <input
          style={{ visibility: "hidden" }}
          ref={inputRef}
          type="file"
          onChange={handleFileUpload}
        />
      </WordGrid>
    </>
  );
};

export default VocabularyStudying;
