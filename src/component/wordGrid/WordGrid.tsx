import styles from "./WordGrid.module.scss";
import { WordType, words } from "../../dummy-data/words";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { shuffleArray, speakText } from "../../utils/utils";
import { Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

type WordDisplayType = {
  id: string;
  type: "word" | "definition";
  content: string;
  codeMatch: string;
  isHide?: boolean;
};

type WordGridProp = {
  dataInit?: WordType[];
  children?: React.ReactNode;
};

const QUANTITY_DISPLAY_WORD = 8;

const WordGrid = ({ dataInit, children }: WordGridProp) => {
  const [wordList, setWordList] = useState<WordDisplayType[]>([]);
  const [currentSelectedCode, setCurrentSelectedCode] =
    useState<WordDisplayType | null>(null);
  const [quantityMatch, setQuantityMatch] = useState<number>(0);

  useEffect(() => {
    let finalListWord = words;
    if (dataInit && dataInit.length > 0) {
      finalListWord = shuffleArray(dataInit).slice(0, QUANTITY_DISPLAY_WORD);
    }
    handleCreateShuffleList(finalListWord);
  }, [dataInit]);

  useEffect(() => {
    if (quantityMatch === QUANTITY_DISPLAY_WORD) {
      setTimeout(() => {
        if (dataInit && dataInit.length > 0) {
          handleCreateShuffleList(
            shuffleArray(dataInit).slice(0, QUANTITY_DISPLAY_WORD)
          );
        }
        setQuantityMatch(0);
      }, 1000);
    }
  }, [quantityMatch]);

  const handleCreateShuffleList = (finalListWord: WordType[]) => {
    const listOfWords: WordDisplayType[] = finalListWord.map((item) => ({
      id: uuid(),
      type: "word",
      content: item.word,
      codeMatch: item.word,
    }));

    const listOfDefinitions: WordDisplayType[] = finalListWord.map((item) => ({
      id: uuid(),
      type: "definition",
      content: item.definition,
      codeMatch: item.word,
    }));

    const shuffledWords = shuffleArray(listOfWords);
    const shuffledDefinitions = shuffleArray(listOfDefinitions);

    const combinedArray = shuffledDefinitions.flatMap((word, i) => [
      word,
      shuffledWords[i],
    ]);
    setWordList(combinedArray);
  };

  const speechCorrectWord = (
    currentSelectedCode: WordDisplayType,
    selectedItem: WordDisplayType
  ) => {
    const wordToSpeech =
      currentSelectedCode?.type === "word"
        ? currentSelectedCode.content
        : selectedItem.content;

    speakText(wordToSpeech);
  };

  const handleOnClickWord = (selectedItem: WordDisplayType) => {
    if (selectedItem.content === currentSelectedCode?.content) return;

    if (currentSelectedCode) {
      if (currentSelectedCode.codeMatch === selectedItem.codeMatch) {
        setQuantityMatch((prev) => prev + 1);
        // Speech correct word match
        speechCorrectWord(currentSelectedCode, selectedItem);

        setTimeout(() => {
          const elements = document.querySelectorAll(
            `[data-code="${selectedItem.codeMatch}"]`
          );
          elements.forEach((element) => {
            element.classList.add(styles.correct_cell);
          });

          setTimeout(() => {
            setWordList((prevList) =>
              prevList.map((item) =>
                item.codeMatch === selectedItem.codeMatch
                  ? { ...item, isHide: true }
                  : item
              )
            );
          }, 600);

          setCurrentSelectedCode(null);
        }, 200);
      } else {
        const elements1 = document.querySelector(
          `[data-id="${currentSelectedCode.id}"]`
        );
        const elements2 = document.querySelector(
          `[data-id="${selectedItem.id}"]`
        );
        elements1?.classList.add(styles.wrong_cell);
        elements2?.classList.add(styles.wrong_cell);
        setTimeout(() => {
          elements1?.classList.remove(styles.wrong_cell);
          elements2?.classList.remove(styles.wrong_cell);
          setCurrentSelectedCode(null);
        }, 600);
      }
    } else {
      setCurrentSelectedCode(selectedItem);
    }
  };

  const handleReloadList = () => {
    if (!dataInit) return;
    handleCreateShuffleList(
      shuffleArray(dataInit).slice(0, QUANTITY_DISPLAY_WORD)
    );
  };

  return (
    <div className={styles.grid_word_container}>
      <div className={styles.btn_group}>
        <Button onClick={handleReloadList} type="default">
          <ReloadOutlined /> Reload list
        </Button>
        {children}
      </div>
      <div className={styles.grid}>
        {wordList?.length &&
          wordList.map((item) => (
            <div
              data-id={item.id}
              data-code={item.codeMatch}
              key={item.content}
              className={`${styles.cell} ${
                item.isHide ? styles.hidden_cell : ""
              }`}
              onClick={() => handleOnClickWord(item)}
            >
              <div
                className={
                  item.type === "word" ? styles.word : styles.definition
                }
              >
                {item.content}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default WordGrid;
