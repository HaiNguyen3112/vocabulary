import { useRef } from "react";
import useFileInput from "../../custom-hook/file-input/UseFileInput";
import { WordType } from "../../dummy-data/words";
import WordGrid from "../wordGrid/WordGrid";

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
      <WordGrid dataInit={data} />
      <button onClick={handleOpenFile}>Upload file vocabulary</button>
      <input
        style={{ visibility: "hidden" }}
        ref={inputRef}
        type="file"
        onChange={handleFileUpload}
      />
    </>
  );
};

export default VocabularyStudying;
