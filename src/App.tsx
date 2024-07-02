import React from "react";
import logo from "./logo.svg";
import style from "./App.module.scss";
import VocabularyStudying from "./component/vocabularyStudying/VocabularyStudying";

function App() {
  return (
    <div className={style.app}>
      <VocabularyStudying />
    </div>
  );
}

export default App;
