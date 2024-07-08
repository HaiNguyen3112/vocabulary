import { CATEGORYTYPE } from "../constant/constant";

// Function to shuffle an array
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Function to speech a word
export const speakText = (text: string, lang: string = "en-US"): void => {
  if (window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  } else {
    alert("Sorry, your browser does not support speech synthesis.");
  }
};

export const getCategoryColor = (category: CATEGORYTYPE) => {
  switch (category) {
    case CATEGORYTYPE.DINNINGOUT:
      return "blue";
    case CATEGORYTYPE.ENTERTAINMENT:
      return "purple";
    case CATEGORYTYPE.GENERAL_BUSINESS:
      return "cyan";
    case CATEGORYTYPE.MANUFACTURING:
      return "green";
    case CATEGORYTYPE.OFFICES:
      return "magenta";
    case CATEGORYTYPE.PERSONAL:
      return "pink";
    case CATEGORYTYPE.PURCHASING:
      return "red";
    case CATEGORYTYPE.TECHNOLOGY:
      return "orange";
    case CATEGORYTYPE.TRAVEL:
      return "yellow";

    default:
      return "blue";
  }
};
